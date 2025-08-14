// Shot Marker Shot Packing Utilities
// Based on the Shot Marker system's shot encoding/decoding functions

// Custom base64 encoding/decoding
const base64_encode_bytes = function(bytes) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = '';
    let i = 0;
    
    while (i < bytes.length) {
        const a = bytes[i++];
        const b = i < bytes.length ? bytes[i++] : 0;
        const c = i < bytes.length ? bytes[i++] : 0;
        
        const bitmap = (a << 16) | (b << 8) | c;
        
        result += chars.charAt((bitmap >> 18) & 63);
        result += chars.charAt((bitmap >> 12) & 63);
        result += i - 2 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=';
        result += i - 1 < bytes.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
};

const base64_decode_bytes = function(str) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const bytes = [];
    let i = 0;
    
    while (i < str.length) {
        const a = chars.indexOf(str.charAt(i++));
        const b = chars.indexOf(str.charAt(i++));
        const c = chars.indexOf(str.charAt(i++));
        const d = chars.indexOf(str.charAt(i++));
        
        const bitmap = (a << 18) | (b << 12) | (c << 6) | d;
        
        bytes.push((bitmap >> 16) & 255);
        if (c !== 64) bytes.push((bitmap >> 8) & 255);
        if (d !== 64) bytes.push(bitmap & 255);
    }
    
    return bytes;
};

// Pack/unpack functions for Shot Marker data structures
function pack_shot(shot) {
    // Pack shot data into bytes for encoding
    const bytes = new Array(32).fill(0); // Allocate 32 bytes for shot data
    
    // Pack timestamp (8 bytes)
    const ts = shot.ts || Date.now();
    for (let i = 0; i < 8; i++) {
        bytes[i] = (ts >> (i * 8)) & 0xFF;
    }
    
    // Pack position (4 bytes each for x, y)
    const x = Math.round((shot.x || 0) * 1000);
    const y = Math.round((shot.y || 0) * 1000);
    
    for (let i = 0; i < 4; i++) {
        bytes[8 + i] = (x >> (i * 8)) & 0xFF;
        bytes[12 + i] = (y >> (i * 8)) & 0xFF;
    }
    
    // Pack velocity (4 bytes)
    const v = Math.round((shot.v || 0) * 100);
    for (let i = 0; i < 4; i++) {
        bytes[16 + i] = (v >> (i * 8)) & 0xFF;
    }
    
    // Pack temperature and other data
    bytes[20] = shot.temp || 20;
    bytes[21] = shot.multi_assign || 0;
    bytes[22] = shot.error || 0;
    
    return bytes;
}

function unpack_shot(bytes) {
    // Unpack shot data from bytes
    const shot = {};
    
    // Unpack timestamp (8 bytes)
    let ts = 0;
    for (let i = 0; i < 8; i++) {
        ts |= (bytes[i] & 0xFF) << (i * 8);
    }
    shot.ts = ts;
    
    // Unpack position (4 bytes each for x, y)
    let x = 0, y = 0;
    for (let i = 0; i < 4; i++) {
        x |= (bytes[8 + i] & 0xFF) << (i * 8);
        y |= (bytes[12 + i] & 0xFF) << (i * 8);
    }
    shot.x = x / 1000.0;
    shot.y = y / 1000.0;
    
    // Unpack velocity (4 bytes)
    let v = 0;
    for (let i = 0; i < 4; i++) {
        v |= (bytes[16 + i] & 0xFF) << (i * 8);
    }
    shot.v = v / 100.0;
    
    // Unpack temperature and other data
    shot.temp = bytes[20];
    shot.multi_assign = bytes[21];
    shot.error = bytes[22];
    
    return shot;
}

// Shot encoding/decoding using base64
function encode_shot(shot) {
    const bytes = pack_shot(shot);
    return base64_encode_bytes(bytes);
}

function decode_shot(encoded) {
    try {
        const bytes = base64_decode_bytes(encoded);
        return unpack_shot(bytes);
    } catch (error) {
        console.error('Error decoding shot:', error);
        return null;
    }
}

// Utility functions
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function min(a, b) {
    return Math.min(a, b);
}

function max(a, b) {
    return Math.max(a, b);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        base64_encode_bytes,
        base64_decode_bytes,
        pack_shot,
        unpack_shot,
        encode_shot,
        decode_shot,
        clamp,
        min,
        max
    };
}
