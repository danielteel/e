#include <iostream>
#include <stdio.h>  
#include <stdlib.h>
#include <time.h>  
#include <string>


uint32_t leftRotate32(uint32_t num, uint8_t places) {
    uint64_t temp = (uint64_t)num << places;
    temp |= (uint64_t)num >> (32 - places);
    return (uint32_t)(temp & 0xFFFFFFFF);
}
uint32_t rightRotate32(uint32_t num, uint8_t places) {
    uint64_t temp = (uint64_t)num >> places;
    temp |= (uint64_t)num << (32 - places);
    return (uint32_t)(temp & 0xFFFFFFFF);
}
uint8_t leftRotate8(uint8_t num, uint8_t places) {
    uint16_t temp = (uint16_t)num << places;
    temp |= (uint16_t)num >> (8 - places);
    return (uint8_t)(temp & 0xFF);
}
uint8_t rightRotate8(uint8_t num, uint8_t places) {
    uint16_t temp = (uint16_t)num >> places;
    temp |= (uint16_t)num << (8 - places);
    return (uint8_t)(temp & 0xFF);
}

uint8_t* frame(const uint8_t* data, uint16_t length, uint16_t& framedLength) {
    uint8_t paddingLength = 4;
    uint8_t modLength = (4 + 2 + length) % 16;
    if (modLength) {
        paddingLength = 16 - modLength % 16 + 4;
    }
    framedLength = 2 + paddingLength + length;
    uint8_t* framed = new uint8_t[framedLength];
    framed[0] = (length >> 8) & 0xFF;
    framed[1] = length & 0xFF;

    for (uint8_t i = 0; i < paddingLength; i++) {
        framed[2 + i] = rand() % 256;
    }

    memmove(framed + 2 + paddingLength, data, sizeof(uint8_t) * length);
    return framed;
}

uint8_t* deframe(const uint8_t* data, uint16_t framedLength, uint16_t& dataLength) {
    dataLength = data[0] << 8 | data[1];

    uint8_t* deframed = new uint8_t[dataLength];
    memmove(deframed, data + (framedLength - dataLength), sizeof(uint8_t) * dataLength);
    return deframed;
}


uint8_t* encrypt(const uint8_t* data, uint16_t dataLength, uint16_t& encryptedLength, const char* keyString) {
    uint8_t* buffer = frame(data, dataLength, encryptedLength);

    uint8_t key[32];
    char tempHex[] = { 0,0,0 };
    for (uint8_t i = 0; i < 64; i += 2) {
        tempHex[0] = keyString[i];
        tempHex[1] = keyString[i + 1];
        key[i >> 1] = strtoul(tempHex, nullptr, 16);
    }

    for (uint8_t k = 0; k < 32; k++) {
        for (uint32_t i = 0; i < encryptedLength - 7; i++) {

            uint32_t b4 = leftRotate32(buffer[i + 0] | buffer[i + 2] << 8 | buffer[i + 4] << 16 | buffer[i + 6] << 24, key[k] % 31);
            buffer[i + 0] = b4 & 0xFF;
            buffer[i + 2] = b4 >> 8 & 0xFF;
            buffer[i + 4] = b4 >> 16 & 0xFF;
            buffer[i + 6] = b4 >> 24 & 0xFF;

            b4 = leftRotate32(buffer[i + 1] | buffer[i + 3] << 8 | buffer[i + 5] << 16 | buffer[i + 7] << 24, key[k] % 31);
            buffer[i + 1] = b4 & 0xFF;
            buffer[i + 3] = b4 >> 8 & 0xFF;
            buffer[i + 5] = b4 >> 16 & 0xFF;
            buffer[i + 7] = b4 >> 24 & 0xFF;

            buffer[i + 0] ^= buffer[i + 1];
            buffer[i + 1] ^= buffer[i + 2];
            buffer[i + 2] ^= buffer[i + 3];
            buffer[i + 3] ^= buffer[i + 4];
            buffer[i + 4] ^= buffer[i + 5];
            buffer[i + 5] ^= buffer[i + 6];
            buffer[i + 6] ^= buffer[i + 7];
            buffer[i + 7] ^= buffer[i + 0];

            buffer[i + 0] ^= key[k];
            buffer[i + 1] ^= leftRotate8(key[k], 0 + buffer[i + 0] % 2);
            buffer[i + 2] ^= leftRotate8(key[k], 1 + buffer[i + 1] % 2);
            buffer[i + 3] ^= leftRotate8(key[k], 2 + buffer[i + 2] % 2);
            buffer[i + 4] ^= leftRotate8(key[k], 3 + buffer[i + 3] % 2);
            buffer[i + 5] ^= leftRotate8(key[k], 4 + buffer[i + 4] % 2);
            buffer[i + 6] ^= leftRotate8(key[k], 5 + buffer[i + 5] % 2);
            buffer[i + 7] ^= leftRotate8(key[k], 6 + buffer[i + 6] % 2);
        }
    }
    return buffer;
}


uint8_t* decrypt(const uint8_t* data, uint16_t dataLength, uint16_t& decryptedLength, const char* keyString) {
    uint8_t key[32];
    char tempHex[] = { 0,0,0 };
    for (uint8_t i = 0; i < 64; i += 2) {
        tempHex[0] = keyString[i];
        tempHex[1] = keyString[i + 1];
        key[i >> 1] = strtoul(tempHex, nullptr, 16);
    }

    uint8_t* buffer = new uint8_t[dataLength];
    memmove(buffer, data, sizeof(uint8_t) * dataLength);

    for (uint8_t k = 31; k >= 0 && k != 0xFF; k--) {
        for (uint32_t i = dataLength - 8; i >= 0 && i != 0xFFFFFFFF; i--) {
            buffer[i + 7] ^= leftRotate8(key[k], 6 + buffer[i + 6] % 2);
            buffer[i + 6] ^= leftRotate8(key[k], 5 + buffer[i + 5] % 2);
            buffer[i + 5] ^= leftRotate8(key[k], 4 + buffer[i + 4] % 2);
            buffer[i + 4] ^= leftRotate8(key[k], 3 + buffer[i + 3] % 2);
            buffer[i + 3] ^= leftRotate8(key[k], 2 + buffer[i + 2] % 2);
            buffer[i + 2] ^= leftRotate8(key[k], 1 + buffer[i + 1] % 2);
            buffer[i + 1] ^= leftRotate8(key[k], 0 + buffer[i + 0] % 2);
            buffer[i + 0] ^= key[k];

            buffer[i + 7] ^= buffer[i + 0];
            buffer[i + 6] ^= buffer[i + 7];
            buffer[i + 5] ^= buffer[i + 6];
            buffer[i + 4] ^= buffer[i + 5];
            buffer[i + 3] ^= buffer[i + 4];
            buffer[i + 2] ^= buffer[i + 3];
            buffer[i + 1] ^= buffer[i + 2];
            buffer[i + 0] ^= buffer[i + 1];

            uint32_t b4 = rightRotate32(buffer[i + 0] | buffer[i + 2] << 8 | buffer[i + 4] << 16 | buffer[i + 6] << 24, key[k] % 31);
            buffer[i + 0] = b4 & 0xFF;
            buffer[i + 2] = b4 >> 8 & 0xFF;
            buffer[i + 4] = b4 >> 16 & 0xFF;
            buffer[i + 6] = b4 >> 24 & 0xFF;

            b4 = rightRotate32(buffer[i + 1] | buffer[i + 3] << 8 | buffer[i + 5] << 16 | buffer[i + 7] << 24, key[k] % 31);
            buffer[i + 1] = b4 & 0xFF;
            buffer[i + 3] = b4 >> 8 & 0xFF;
            buffer[i + 5] = b4 >> 16 & 0xFF;
            buffer[i + 7] = b4 >> 24 & 0xFF;
        }
    }

    uint8_t* decrypted = deframe(buffer, dataLength, decryptedLength);

    delete[] buffer;
    return decrypted;
}