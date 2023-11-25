#include <iostream>
#include <stdio.h>  
#include <stdlib.h>
#include <time.h>  
#include <string>
#include <stdint.h>
#include "crypto.h"


const char* keyString = "5c97b02ae05b748dcb67230065ddf4b8a831a17826cf44a4f90a91349da78cb3";
const char* stringToEncrypt = "HelloWorld";



void doThang()
{
    uint16_t encryptedLength;
    uint8_t* encrypted=encrypt((const uint8_t*)stringToEncrypt, strlen(stringToEncrypt) + 1, encryptedLength, keyString);

    std::cout << "\nEncrypted: size=" << std::to_string(encryptedLength) << " ";
    for (unsigned int i = 0; i < encryptedLength; i++) {
        int l = strlen(std::to_string(encrypted[i]).c_str());
        for (int i = 0; i < 3 - l; i++) {
            std::cout << "0";
        }
        std::cout << std::to_string(encrypted[i]);
    }
    std::cout << "\n";

    uint16_t decryptedLength;
    uint8_t* decrypted = decrypt(encrypted, encryptedLength, decryptedLength, keyString);
  

    std::cout << (char*)decrypted << "\n";
   
    if (strcmp(stringToEncrypt, (const char*)decrypted)) {
        std::cout << "Mismatch";
    }

    delete[] encrypted;
    delete[] decrypted;
}

int main() {
    srand(time(NULL));
    for (int i = 0; i < 1000000; i++) {
        doThang();
    }
}

/*  std::cout << "\nEncrypted: size=" << std::to_string(encryptedLength) << " ";
    for (unsigned int i = 0; i < encryptedLength; i++) {
        int l = strlen(std::to_string(encrypted[i]).c_str());
        for (int i = 0; i < 3 - l; i++) {
            std::cout << "0";
        }
        std::cout << std::to_string(encrypted[i]);
    }
    std::cout << "\nDecrypted: size="<<std::to_string(decryptedLength)<<" ";
    for (unsigned int i = 0; i < decryptedLength; i++) {
        int l = strlen(std::to_string(decrypted[i]).c_str());
        for (int i = 0; i < 3 - l; i++) {
            std::cout << "0";
        }
        std::cout << std::to_string(decrypted[i]);
    }*/