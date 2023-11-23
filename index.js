let keyString = "5c97b02ae05b748dcb67230065ddf4b8a831a17826cf44a4f90a91349da78c07";
//Turn key string into number array
const key=[];
if (keyString.length!=64){
    throw "Invalid key length: "+keyString.length+". Needs to be 64";
}
for (let i=0;i<keyString.length;i+=2){
    key[Math.floor(i/2)] = parseInt(keyString.substring(i, i+2), 16);
}


const bytesToEncrypt = (new TextEncoder()).encode("HelloWorld");

const framed = frame(bytesToEncrypt);
//console.log(framed);

const encrypted = encrypt(framed);
console.log(Array.from(encrypted).map(v => {
    return v.toString(16).padStart(2,'0')
}).join(' '))
//console.log(encrypted);

const decrypted = decrypt(encrypted);
//console.log(decrypted);

console.log(framed.every( (value, index) => {
    return value==decrypted[index];
}));


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


function leftRotate(num,  places, bits)
{
    return (num << places) | (num >>> (bits - places)) & 0xFFFFFFFF;
}
function rightRotate(num,  places, bits)
{
    return (num >>> places) | (num << (bits - places)) & 0xFFFFFFFF;
}


function encrypt(data){
    const buffer = new Uint8Array(data.length);
    buffer.set(data);
    const table = new Uint16Array(2);

    for (let i=0;i<buffer.length-4;i++){
        table[0]=buffer[i+0] | buffer[i+1]<<8;
        table[1]=buffer[i+2] | buffer[i+3]<<8;

        table[0]=leftRotate(table[0], 9, 16);
        table[1]=leftRotate(table[1], 11, 16);


        buffer[i+3]=table[0]    & 0xFF;
        buffer[i+2]=table[0]>>8 & 0xFF;
        buffer[i+1]=table[1]    & 0xFF;
        buffer[i+0]=table[1]>>8 & 0xFF;

    }

    return buffer;
}

function decrypt(data){    
    const buffer = new Uint8Array(data.length);
    buffer.set(data);
    const table = new Uint16Array(2);

    for (let i=buffer.length-5;i>=0;i--){
        table[0]=buffer[i+3] | buffer[i+2]<<8;
        table[1]=buffer[i+1] | buffer[i+0]<<8;

        table[0]=rightRotate(table[0], 9, 16);
        table[1]=rightRotate(table[1], 11, 16);

        buffer[i+0]=table[0]    & 0xFF;
        buffer[i+1]=table[0]>>8 & 0xFF;
        buffer[i+2]=table[1]    & 0xFF;
        buffer[i+3]=table[1]>>8 & 0xFF;
    }

    return buffer;
}

// function encrypt(data){
//     const buffer = new Uint8Array(data.length);
//     buffer.set(data);
//     const table = new Uint32Array(4);

//     for (let i=0;i<buffer.length-15;i+=1){
//         table[0]=buffer[i+0] | buffer[i+1]<<8 | buffer[i+2]<<16 | buffer[i+3]<<24;
//         table[1]=buffer[i+4] | buffer[i+5]<<8 | buffer[i+6]<<16 | buffer[i+7]<<24;
//         table[2]=buffer[i+8] | buffer[i+9]<<8 | buffer[i+10]<<16 | buffer[i+11]<<24;
//         table[3]=buffer[i+12] | buffer[i+13]<<8 | buffer[i+14]<<16 | buffer[i+15]<<24;

//         table[0]=leftRotate(table[0], 1, 32);
//         table[1]=leftRotate(table[1], 3, 32);
//         table[2]=leftRotate(table[2], 7, 32);
//         table[3]=leftRotate(table[3], 13, 32);


//         buffer[i+0]=table[0] & 0xFF;
//         buffer[i+1]=table[0]>>8 & 0xFF;
//         buffer[i+2]=table[0]>>16 & 0xFF;
//         buffer[i+3]=table[0]>>24 & 0xFF;

//         buffer[i+4]=table[1] & 0xFF;
//         buffer[i+5]=table[1]>>8 & 0xFF;
//         buffer[i+6]=table[1]>>16 & 0xFF;
//         buffer[i+7]=table[1]>>24 & 0xFF;

//         buffer[i+8]=table[2] & 0xFF;
//         buffer[i+9]=table[2]>>8 & 0xFF;
//         buffer[i+10]=table[2]>>16 & 0xFF;
//         buffer[i+11]=table[2]>>24 & 0xFF;

//         buffer[i+12]=table[3] & 0xFF;
//         buffer[i+13]=table[3]>>8 & 0xFF;
//         buffer[i+14]=table[3]>>16 & 0xFF;
//         buffer[i+15]=table[3]>>24 & 0xFF;
//     }

//     return buffer;
// }

// function decrypt(data){
//     const buffer = new Uint8Array(data.length);
//     buffer.set(data);
//     const table = new Uint32Array(4);

//     for (let i=buffer.length-16;i>=0;i-=1){

//         table[0]=buffer[i+0] | buffer[i+1]<<8 | buffer[i+2]<<16 | buffer[i+3]<<24;
//         table[1]=buffer[i+4] | buffer[i+5]<<8 | buffer[i+6]<<16 | buffer[i+7]<<24;
//         table[2]=buffer[i+8] | buffer[i+9]<<8 | buffer[i+10]<<16 | buffer[i+11]<<24;
//         table[3]=buffer[i+12] | buffer[i+13]<<8 | buffer[i+14]<<16 | buffer[i+15]<<24;

//         table[0]=rightRotate(table[0], 1, 32);
//         table[1]=rightRotate(table[1], 3, 32);
//         table[2]=rightRotate(table[2], 7, 32);
//         table[3]=rightRotate(table[3], 13, 32);
        
//         buffer[i+0]=table[0] & 0xFF;
//         buffer[i+1]=table[0]>>8 & 0xFF;
//         buffer[i+2]=table[0]>>16 & 0xFF;
//         buffer[i+3]=table[0]>>24 & 0xFF;

//         buffer[i+4]=table[1] & 0xFF;
//         buffer[i+5]=table[1]>>8 & 0xFF;
//         buffer[i+6]=table[1]>>16 & 0xFF;
//         buffer[i+7]=table[1]>>24 & 0xFF;

//         buffer[i+8]=table[2] & 0xFF;
//         buffer[i+9]=table[2]>>8 & 0xFF;
//         buffer[i+10]=table[2]>>16 & 0xFF;
//         buffer[i+11]=table[2]>>24 & 0xFF;

//         buffer[i+12]=table[3] & 0xFF;
//         buffer[i+13]=table[3]>>8 & 0xFF;
//         buffer[i+14]=table[3]>>16 & 0xFF;
//         buffer[i+15]=table[3]>>24 & 0xFF;
//     }

//     return buffer;
// }