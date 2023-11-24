let keyString = "5c97b02ae05b748dcb67230065ddf4b8a831a17826cf44a4f90a91349da78cb3";

const stringToEncrypt = 'Hello'

const encrypted = encrypt((new TextEncoder()).encode(stringToEncrypt), keyString, 1);

console.log("Encrypted", encrypted.length, Array.from(encrypted).map(v => v.toString(16).padStart(2,'0')).join(' '));

const decrypted = (new TextDecoder).decode(decrypt(encrypted, keyString, 1));

if (stringToEncrypt!=decrypted){
    console.error("Decrypted doesnt match");
    throw "Decrypted doesnt match"
}





function leftRotate32(num,  places){
    return ((num << places) | (num >>> (32 - places))) & 0xFFFFFFFF;
}
function rightRotate32(num,  places){
    return ((num >>> places) | (num << (32 - places))) & 0xFFFFFFFF;
}
function leftRotate8(num,  places){
    return ((num << places) | (num >>> (8 - places))) & 0xFF;
}
function rightRotate8(num,  places){
    return ((num >>> places) | (num << (8 - places))) & 0xFF;
}

function frame(bytes){
    if (!(bytes instanceof Uint8Array)){
        throw 'frame expects data to be Uint8Array';
    }
    let paddingLength=4;
    const modLength = (4+2+bytes.length)%16
    if (modLength){
        paddingLength=16-modLength%16 + 4;
    }
    const framed = new Uint8Array(paddingLength+2+bytes.length);
    framed[0]=bytes.length >> 8;
    framed[1]=bytes.length & 0xFF;
    for (let i=0;i<paddingLength;i++){
        framed[2+i]=Math.floor(Math.random()*256);//Need more secure random number solution
    }
    framed.set(bytes, 2+paddingLength);
    return framed;
}

function encrypt(data, keyString, rounds=1){
    let key=[];
    if (typeof keyString==='string'){
        if (keyString.length!=64){
            throw "Invalid hex key length: "+keyString.length+". Needs to be 64.";
        }
        for (let i=0;i<keyString.length;i+=2){
            key[Math.floor(i/2)] = parseInt(keyString.substring(i, i+2), 16);
        }
    }else{
        if (keyString.length!=32){
            throw 'Invalid array key length:'+keyString.length+". Needs to be 32.";
        }
        key=keyString;
    }

    rounds--;
    let buffer = frame(data);
    if (buffer.length>0xFFFF) throw 'data needs to be less than 0xFFF0 in size';

    for (let k=0;k<key.length;k++){
        for (let i=0;i<buffer.length-7;i+=1){

            let b4=leftRotate32(buffer[i+0] | buffer[i+2]<<8 | buffer[i+4]<<16 | buffer[i+6]<<24, key[k]%31);
            buffer[i+0] = b4 & 0xFF;
            buffer[i+2] = b4>>8 & 0xFF;
            buffer[i+4] = b4>>16 & 0xFF;
            buffer[i+6] = b4>>24 & 0xFF;
            
            b4=leftRotate32(buffer[i+1] | buffer[i+3]<<8 | buffer[i+5]<<16 | buffer[i+7]<<24, key[k]%31);
            buffer[i+1] = b4 & 0xFF;
            buffer[i+3] = b4>>8 & 0xFF;
            buffer[i+5] = b4>>16 & 0xFF;
            buffer[i+7] = b4>>24 & 0xFF;

            buffer[i+0] ^= buffer[i+1];
            buffer[i+1] ^= buffer[i+2];
            buffer[i+2] ^= buffer[i+3];
            buffer[i+3] ^= buffer[i+4];
            buffer[i+4] ^= buffer[i+5];
            buffer[i+5] ^= buffer[i+6];
            buffer[i+6] ^= buffer[i+7];
            buffer[i+7] ^= buffer[i+0];

            buffer[i+0] ^= key[k];
            buffer[i+1] ^= leftRotate8(key[k], 0 + buffer[i+0]%2);
            buffer[i+2] ^= leftRotate8(key[k], 1 + buffer[i+1]%2);
            buffer[i+3] ^= leftRotate8(key[k], 2 + buffer[i+2]%2);
            buffer[i+4] ^= leftRotate8(key[k], 3 + buffer[i+3]%2);
            buffer[i+5] ^= leftRotate8(key[k], 4 + buffer[i+4]%2);
            buffer[i+6] ^= leftRotate8(key[k], 5 + buffer[i+5]%2);
            buffer[i+7] ^= leftRotate8(key[k], 6 + buffer[i+6]%2);
        }
    }
    if (rounds) buffer=encrypt(buffer, key, rounds);
    return buffer;
}

function decrypt(data, keyString, rounds=1){    
    let key=[];
    if (typeof keyString==='string'){
        if (keyString.length!=64){
            throw "Invalid hex key length: "+keyString.length+". Needs to be 64.";
        }
        for (let i=0;i<keyString.length;i+=2){
            key[Math.floor(i/2)] = parseInt(keyString.substring(i, i+2), 16);
        }
    }else{
        if (keyString.length!=32){
            throw 'Invalid array key length:'+keyString.length+". Needs to be 32.";
        }
        key=keyString;
    }

    rounds--;
    let buffer = new Uint8Array(data.length);
    buffer.set(data);

    for (let k=key.length-1;k>=0;k--){
        for (let i=data.length-8;i>=0;i-=1){
            buffer[i+7] ^= leftRotate8(key[k], 6 + buffer[i+6]%2);
            buffer[i+6] ^= leftRotate8(key[k], 5 + buffer[i+5]%2);
            buffer[i+5] ^= leftRotate8(key[k], 4 + buffer[i+4]%2);
            buffer[i+4] ^= leftRotate8(key[k], 3 + buffer[i+3]%2);
            buffer[i+3] ^= leftRotate8(key[k], 2 + buffer[i+2]%2);
            buffer[i+2] ^= leftRotate8(key[k], 1 + buffer[i+1]%2);
            buffer[i+1] ^= leftRotate8(key[k], 0 + buffer[i+0]%2);
            buffer[i+0] ^= key[k];

            buffer[i+7] ^= buffer[i+0];
            buffer[i+6] ^= buffer[i+7];
            buffer[i+5] ^= buffer[i+6];
            buffer[i+4] ^= buffer[i+5];
            buffer[i+3] ^= buffer[i+4];
            buffer[i+2] ^= buffer[i+3];
            buffer[i+1] ^= buffer[i+2];
            buffer[i+0] ^= buffer[i+1];
            
            let b4=rightRotate32(buffer[i+0] | buffer[i+2]<<8 | buffer[i+4]<<16 | buffer[i+6]<<24, key[k]%31);
            buffer[i+0] = b4 & 0xFF;
            buffer[i+2] = b4>>8 & 0xFF;
            buffer[i+4] = b4>>16 & 0xFF;
            buffer[i+6] = b4>>24 & 0xFF;

            b4=rightRotate32(buffer[i+1] | buffer[i+3]<<8 | buffer[i+5]<<16 | buffer[i+7]<<24, key[k]%31);
            buffer[i+1] = b4 & 0xFF;
            buffer[i+3] = b4>>8 & 0xFF;
            buffer[i+5] = b4>>16 & 0xFF;
            buffer[i+7] = b4>>24 & 0xFF;
        }
    }

    if (rounds){
        const len = buffer[0]<<8|buffer[1];
        buffer=decrypt(buffer.subarray(buffer.length-len), key, rounds);
    }

    const len = buffer[0]<<8|buffer[1];
    return buffer.subarray(buffer.length-len);
}


//         table[0]=(buffer[j(i+0)]&1&&1)  |((buffer[j(i+1)]&1&&1)<<1)  |((buffer[j(i+2)]&1&&1)<<2)  |((buffer[j(i+3)]&1&&1)<<3)  |((buffer[j(i+4)]&1&&1)<<4)  |((buffer[j(i+5)]&1&&1)<<5)  |((buffer[j(i+6)]&1&&1)<<6)  |((buffer[j(i+7)]&1&&1)<<7);
//         table[1]=(buffer[j(i+0)]&2&&1)  |((buffer[j(i+1)]&2&&1)<<1)  |((buffer[j(i+2)]&2&&1)<<2)  |((buffer[j(i+3)]&2&&1)<<3)  |((buffer[j(i+4)]&2&&1)<<4)  |((buffer[j(i+5)]&2&&1)<<5)  |((buffer[j(i+6)]&2&&1)<<6)  |((buffer[j(i+7)]&2&&1)<<7);
//         table[2]=(buffer[j(i+0)]&4&&1)  |((buffer[j(i+1)]&4&&1)<<1)  |((buffer[j(i+2)]&4&&1)<<2)  |((buffer[j(i+3)]&4&&1)<<3)  |((buffer[j(i+4)]&4&&1)<<4)  |((buffer[j(i+5)]&4&&1)<<5)  |((buffer[j(i+6)]&4&&1)<<6)  |((buffer[j(i+7)]&4&&1)<<7);
//         table[3]=(buffer[j(i+0)]&8&&1)  |((buffer[j(i+1)]&8&&1)<<1)  |((buffer[j(i+2)]&8&&1)<<2)  |((buffer[j(i+3)]&8&&1)<<3)  |((buffer[j(i+4)]&8&&1)<<4)  |((buffer[j(i+5)]&8&&1)<<5)  |((buffer[j(i+6)]&8&&1)<<6)  |((buffer[j(i+7)]&8&&1)<<7);
//         table[4]=(buffer[j(i+0)]&16&&1) |((buffer[j(i+1)]&16&&1)<<1) |((buffer[j(i+2)]&16&&1)<<2) |((buffer[j(i+3)]&16&&1)<<3) |((buffer[j(i+4)]&16&&1)<<4) |((buffer[j(i+5)]&16&&1)<<5) |((buffer[j(i+6)]&16&&1)<<6) |((buffer[j(i+7)]&16&&1)<<7);
//         table[5]=(buffer[j(i+0)]&32&&1) |((buffer[j(i+1)]&32&&1)<<1) |((buffer[j(i+2)]&32&&1)<<2) |((buffer[j(i+3)]&32&&1)<<3) |((buffer[j(i+4)]&32&&1)<<4) |((buffer[j(i+5)]&32&&1)<<5) |((buffer[j(i+6)]&32&&1)<<6) |((buffer[j(i+7)]&32&&1)<<7);
//         table[6]=(buffer[j(i+0)]&64&&1) |((buffer[j(i+1)]&64&&1)<<1) |((buffer[j(i+2)]&64&&1)<<2) |((buffer[j(i+3)]&64&&1)<<3) |((buffer[j(i+4)]&64&&1)<<4) |((buffer[j(i+5)]&64&&1)<<5) |((buffer[j(i+6)]&64&&1)<<6) |((buffer[j(i+7)]&64&&1)<<7);
//         table[7]=(buffer[j(i+0)]&128&&1)|((buffer[j(i+1)]&128&&1)<<1)|((buffer[j(i+2)]&128&&1)<<2)|((buffer[j(i+3)]&128&&1)<<3)|((buffer[j(i+4)]&128&&1)<<4)|((buffer[j(i+5)]&128&&1)<<5)|((buffer[j(i+6)]&128&&1)<<6)|((buffer[j(i+7)]&128&&1)<<7);
        
//         table[0]=rightRotate(table[0], 1, 8);
//         table[1]=rightRotate(table[1], 1, 8);
//         table[2]=rightRotate(table[2], 1, 8);
//         table[3]=rightRotate(table[3], 1, 8);
//         table[4]=rightRotate(table[4], 1, 8);
//         table[5]=rightRotate(table[5], 1, 8);
//         table[6]=rightRotate(table[6], 1, 8);
//         table[7]=rightRotate(table[7], 1, 8);

//         buffer[j(i+0)] = ((table[0]&1  &&1))|((table[1]&1  &&1)<<1)|((table[2]&1  &&1)<<2)|((table[3]&1  &&1)<<3)|((table[4]&1  &&1)<<4)|((table[5]&1  &&1)<<5)|((table[6]&1  &&1)<<6)|((table[7]&1   &&1)<<7);
//         buffer[j(i+1)] = ((table[0]&2  &&1))|((table[1]&2  &&1)<<1)|((table[2]&2  &&1)<<2)|((table[3]&2  &&1)<<3)|((table[4]&2  &&1)<<4)|((table[5]&2  &&1)<<5)|((table[6]&2  &&1)<<6)|((table[7]&2   &&1)<<7);
//         buffer[j(i+2)] = ((table[0]&4  &&1))|((table[1]&4  &&1)<<1)|((table[2]&4  &&1)<<2)|((table[3]&4  &&1)<<3)|((table[4]&4  &&1)<<4)|((table[5]&4  &&1)<<5)|((table[6]&4  &&1)<<6)|((table[7]&4   &&1)<<7);
//         buffer[j(i+3)] = ((table[0]&8  &&1))|((table[1]&8  &&1)<<1)|((table[2]&8  &&1)<<2)|((table[3]&8  &&1)<<3)|((table[4]&8  &&1)<<4)|((table[5]&8  &&1)<<5)|((table[6]&8  &&1)<<6)|((table[7]&8   &&1)<<7);
//         buffer[j(i+4)] = ((table[0]&16 &&1))|((table[1]&16 &&1)<<1)|((table[2]&16 &&1)<<2)|((table[3]&16 &&1)<<3)|((table[4]&16 &&1)<<4)|((table[5]&16 &&1)<<5)|((table[6]&16 &&1)<<6)|((table[7]&16  &&1)<<7);
//         buffer[j(i+5)] = ((table[0]&32 &&1))|((table[1]&32 &&1)<<1)|((table[2]&32 &&1)<<2)|((table[3]&32 &&1)<<3)|((table[4]&32 &&1)<<4)|((table[5]&32 &&1)<<5)|((table[6]&32 &&1)<<6)|((table[7]&32  &&1)<<7);
//         buffer[j(i+6)] = ((table[0]&64 &&1))|((table[1]&64 &&1)<<1)|((table[2]&64 &&1)<<2)|((table[3]&64 &&1)<<3)|((table[4]&64 &&1)<<4)|((table[5]&64 &&1)<<5)|((table[6]&64 &&1)<<6)|((table[7]&64  &&1)<<7);
//         buffer[j(i+7)] = ((table[0]&128&&1))|((table[1]&128&&1)<<1)|((table[2]&128&&1)<<2)|((table[3]&128&&1)<<3)|((table[4]&128&&1)<<4)|((table[5]&128&&1)<<5)|((table[6]&128&&1)<<6)|((table[7]&128 &&1)<<7);

//         table[0]=(buffer[j(i+0)]&1&&1)  |((buffer[j(i+1)]&1&&1)<<1)  |((buffer[j(i+2)]&1&&1)<<2)  |((buffer[j(i+3)]&1&&1)<<3)  |((buffer[j(i+4)]&1&&1)<<4)  |((buffer[j(i+5)]&1&&1)<<5)  |((buffer[j(i+6)]&1&&1)<<6)  |((buffer[j(i+7)]&1&&1)<<7);
//         table[1]=(buffer[j(i+0)]&2&&1)  |((buffer[j(i+1)]&2&&1)<<1)  |((buffer[j(i+2)]&2&&1)<<2)  |((buffer[j(i+3)]&2&&1)<<3)  |((buffer[j(i+4)]&2&&1)<<4)  |((buffer[j(i+5)]&2&&1)<<5)  |((buffer[j(i+6)]&2&&1)<<6)  |((buffer[j(i+7)]&2&&1)<<7);
//         table[2]=(buffer[j(i+0)]&4&&1)  |((buffer[j(i+1)]&4&&1)<<1)  |((buffer[j(i+2)]&4&&1)<<2)  |((buffer[j(i+3)]&4&&1)<<3)  |((buffer[j(i+4)]&4&&1)<<4)  |((buffer[j(i+5)]&4&&1)<<5)  |((buffer[j(i+6)]&4&&1)<<6)  |((buffer[j(i+7)]&4&&1)<<7);
//         table[3]=(buffer[j(i+0)]&8&&1)  |((buffer[j(i+1)]&8&&1)<<1)  |((buffer[j(i+2)]&8&&1)<<2)  |((buffer[j(i+3)]&8&&1)<<3)  |((buffer[j(i+4)]&8&&1)<<4)  |((buffer[j(i+5)]&8&&1)<<5)  |((buffer[j(i+6)]&8&&1)<<6)  |((buffer[j(i+7)]&8&&1)<<7);
//         table[4]=(buffer[j(i+0)]&16&&1) |((buffer[j(i+1)]&16&&1)<<1) |((buffer[j(i+2)]&16&&1)<<2) |((buffer[j(i+3)]&16&&1)<<3) |((buffer[j(i+4)]&16&&1)<<4) |((buffer[j(i+5)]&16&&1)<<5) |((buffer[j(i+6)]&16&&1)<<6) |((buffer[j(i+7)]&16&&1)<<7);
//         table[5]=(buffer[j(i+0)]&32&&1) |((buffer[j(i+1)]&32&&1)<<1) |((buffer[j(i+2)]&32&&1)<<2) |((buffer[j(i+3)]&32&&1)<<3) |((buffer[j(i+4)]&32&&1)<<4) |((buffer[j(i+5)]&32&&1)<<5) |((buffer[j(i+6)]&32&&1)<<6) |((buffer[j(i+7)]&32&&1)<<7);
//         table[6]=(buffer[j(i+0)]&64&&1) |((buffer[j(i+1)]&64&&1)<<1) |((buffer[j(i+2)]&64&&1)<<2) |((buffer[j(i+3)]&64&&1)<<3) |((buffer[j(i+4)]&64&&1)<<4) |((buffer[j(i+5)]&64&&1)<<5) |((buffer[j(i+6)]&64&&1)<<6) |((buffer[j(i+7)]&64&&1)<<7);
//         table[7]=(buffer[j(i+0)]&128&&1)|((buffer[j(i+1)]&128&&1)<<1)|((buffer[j(i+2)]&128&&1)<<2)|((buffer[j(i+3)]&128&&1)<<3)|((buffer[j(i+4)]&128&&1)<<4)|((buffer[j(i+5)]&128&&1)<<5)|((buffer[j(i+6)]&128&&1)<<6)|((buffer[j(i+7)]&128&&1)<<7);
        
//         table[0]=leftRotate(table[0], 1, 8);
//         table[1]=leftRotate(table[1], 1, 8);
//         table[2]=leftRotate(table[2], 1, 8);
//         table[3]=leftRotate(table[3], 1, 8);
//         table[4]=leftRotate(table[4], 1, 8);
//         table[5]=leftRotate(table[5], 1, 8);
//         table[6]=leftRotate(table[6], 1, 8);
//         table[7]=leftRotate(table[7], 1, 8);

//         buffer[j(i+0)] = ((table[0]&1  &&1))|((table[1]&1  &&1)<<1)|((table[2]&1  &&1)<<2)|((table[3]&1  &&1)<<3)|((table[4]&1  &&1)<<4)|((table[5]&1  &&1)<<5)|((table[6]&1  &&1)<<6)|((table[7]&1   &&1)<<7);
//         buffer[j(i+1)] = ((table[0]&2  &&1))|((table[1]&2  &&1)<<1)|((table[2]&2  &&1)<<2)|((table[3]&2  &&1)<<3)|((table[4]&2  &&1)<<4)|((table[5]&2  &&1)<<5)|((table[6]&2  &&1)<<6)|((table[7]&2   &&1)<<7);
//         buffer[j(i+2)] = ((table[0]&4  &&1))|((table[1]&4  &&1)<<1)|((table[2]&4  &&1)<<2)|((table[3]&4  &&1)<<3)|((table[4]&4  &&1)<<4)|((table[5]&4  &&1)<<5)|((table[6]&4  &&1)<<6)|((table[7]&4   &&1)<<7);
//         buffer[j(i+3)] = ((table[0]&8  &&1))|((table[1]&8  &&1)<<1)|((table[2]&8  &&1)<<2)|((table[3]&8  &&1)<<3)|((table[4]&8  &&1)<<4)|((table[5]&8  &&1)<<5)|((table[6]&8  &&1)<<6)|((table[7]&8   &&1)<<7);
//         buffer[j(i+4)] = ((table[0]&16 &&1))|((table[1]&16 &&1)<<1)|((table[2]&16 &&1)<<2)|((table[3]&16 &&1)<<3)|((table[4]&16 &&1)<<4)|((table[5]&16 &&1)<<5)|((table[6]&16 &&1)<<6)|((table[7]&16  &&1)<<7);
//         buffer[j(i+5)] = ((table[0]&32 &&1))|((table[1]&32 &&1)<<1)|((table[2]&32 &&1)<<2)|((table[3]&32 &&1)<<3)|((table[4]&32 &&1)<<4)|((table[5]&32 &&1)<<5)|((table[6]&32 &&1)<<6)|((table[7]&32  &&1)<<7);
//         buffer[j(i+6)] = ((table[0]&64 &&1))|((table[1]&64 &&1)<<1)|((table[2]&64 &&1)<<2)|((table[3]&64 &&1)<<3)|((table[4]&64 &&1)<<4)|((table[5]&64 &&1)<<5)|((table[6]&64 &&1)<<6)|((table[7]&64  &&1)<<7);
//         buffer[j(i+7)] = ((table[0]&128&&1))|((table[1]&128&&1)<<1)|((table[2]&128&&1)<<2)|((table[3]&128&&1)<<3)|((table[4]&128&&1)<<4)|((table[5]&128&&1)<<5)|((table[6]&128&&1)<<6)|((table[7]&128 &&1)<<7);
