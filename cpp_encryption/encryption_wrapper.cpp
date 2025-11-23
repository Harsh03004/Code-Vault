#include <emscripten.h>
#include <string>
#include <vector>
#include <cstring>
#include <cstdlib>
#include <ctime>
#include "aes.h"

extern "C" {
  
  // Base64 encoding table
  static const char base64_chars[] = 
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

  // Base64 encode function
  std::string base64_encode(const uint8_t* input, size_t length) {
    std::string encoded;
    int val = 0;
    int valb = -6;
    
    for (size_t i = 0; i < length; i++) {
      val = (val << 8) + input[i];
      valb += 8;
      while (valb >= 0) {
        encoded.push_back(base64_chars[(val >> valb) & 0x3F]);
        valb -= 6;
      }
    }
    
    if (valb > -6) {
      encoded.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
    }
    
    while (encoded.size() % 4) {
      encoded.push_back('=');
    }
    
    return encoded;
  }

  // Base64 decode function
  std::vector<uint8_t> base64_decode(const std::string& input) {
    std::vector<uint8_t> decoded;
    std::vector<int> T(256, -1);
    
    for (int i = 0; i < 64; i++) {
      T[base64_chars[i]] = i;
    }
    
    int val = 0;
    int valb = -8;
    
    for (unsigned char c : input) {
      if (T[c] == -1) break;
      val = (val << 6) + T[c];
      valb += 6;
      if (valb >= 0) {
        decoded.push_back((val >> valb) & 0xFF);
        valb -= 8;
      }
    }
    
    return decoded;
  }

  // SHA-256 simplified key derivation (for password to 256-bit key)
  void derive_key(const char* password, uint8_t* key) {
    // Simple key derivation: repeat password to fill 32 bytes
    size_t pass_len = strlen(password);
    for (int i = 0; i < 32; i++) {
      key[i] = password[i % pass_len] ^ (i * 7); // Add some variation
    }
  }

  // PKCS7 padding
  std::vector<uint8_t> add_padding(const uint8_t* data, size_t length) {
    size_t padding_len = 16 - (length % 16);
    std::vector<uint8_t> padded(length + padding_len);
    
    memcpy(padded.data(), data, length);
    
    for (size_t i = length; i < padded.size(); i++) {
      padded[i] = (uint8_t)padding_len;
    }
    
    return padded;
  }

  // Remove PKCS7 padding
  std::vector<uint8_t> remove_padding(const uint8_t* data, size_t length) {
    if (length == 0) return std::vector<uint8_t>();
    
    uint8_t padding_len = data[length - 1];
    
    if (padding_len > 16 || padding_len > length) {
      return std::vector<uint8_t>(); // Invalid padding
    }
    
    // Verify padding
    for (size_t i = length - padding_len; i < length; i++) {
      if (data[i] != padding_len) {
        return std::vector<uint8_t>(); // Invalid padding
      }
    }
    
    std::vector<uint8_t> unpadded(length - padding_len);
    memcpy(unpadded.data(), data, length - padding_len);
    
    return unpadded;
  }

  // Generate random IV
  void generate_iv(uint8_t* iv) {
    static bool seeded = false;
    if (!seeded) {
      srand(time(NULL));
      seeded = true;
    }
    
    for (int i = 0; i < 16; i++) {
      iv[i] = rand() % 256;
    }
  }

  EMSCRIPTEN_KEEPALIVE
  const char* encrypt(const char* data, const char* password) {
    try {
      // Derive 256-bit key from password
      uint8_t key[32];
      derive_key(password, key);
      
      // Create AES cipher
      AES aes(key);
      
      // Generate random IV
      uint8_t iv[16];
      generate_iv(iv);
      
      // Add PKCS7 padding
      size_t data_len = strlen(data);
      std::vector<uint8_t> padded = add_padding((const uint8_t*)data, data_len);
      
      // Encrypt using CBC mode
      std::vector<uint8_t> encrypted(padded.size());
      uint8_t prev_block[16];
      memcpy(prev_block, iv, 16);
      
      for (size_t i = 0; i < padded.size(); i += 16) {
        uint8_t block[16];
        
        // XOR with previous ciphertext block (CBC mode)
        for (int j = 0; j < 16; j++) {
          block[j] = padded[i + j] ^ prev_block[j];
        }
        
        // Encrypt block
        aes.encrypt_block(block, &encrypted[i]);
        
        // Save for next iteration
        memcpy(prev_block, &encrypted[i], 16);
      }
      
      // Prepend IV to encrypted data
      std::vector<uint8_t> result(16 + encrypted.size());
      memcpy(result.data(), iv, 16);
      memcpy(result.data() + 16, encrypted.data(), encrypted.size());
      
      // Base64 encode
      std::string encoded = base64_encode(result.data(), result.size());
      
      // Allocate and return result
      char* output = new char[encoded.length() + 1];
      strcpy(output, encoded.c_str());
      return output;
      
    } catch (...) {
      const char* error_msg = "ENCRYPTION_ERROR";
      char* output = new char[strlen(error_msg) + 1];
      strcpy(output, error_msg);
      return output;
    }
  }

  EMSCRIPTEN_KEEPALIVE
  const char* decrypt(const char* data, const char* password) {
    try {
      // Base64 decode
      std::vector<uint8_t> decoded = base64_decode(std::string(data));
      
      if (decoded.size() < 32) { // At least IV + one block
        const char* error_msg = "DECRYPTION_ERROR";
        char* output = new char[strlen(error_msg) + 1];
        strcpy(output, error_msg);
        return output;
      }
      
      // Extract IV
      uint8_t iv[16];
      memcpy(iv, decoded.data(), 16);
      
      // Derive key from password
      uint8_t key[32];
      derive_key(password, key);
      
      // Create AES cipher
      AES aes(key);
      
      // Decrypt using CBC mode
      size_t encrypted_len = decoded.size() - 16;
      std::vector<uint8_t> decrypted(encrypted_len);
      uint8_t prev_block[16];
      memcpy(prev_block, iv, 16);
      
      for (size_t i = 0; i < encrypted_len; i += 16) {
        uint8_t block[16];
        
        // Decrypt block
        aes.decrypt_block(&decoded[16 + i], block);
        
        // XOR with previous ciphertext block (CBC mode)
        for (int j = 0; j < 16; j++) {
          decrypted[i + j] = block[j] ^ prev_block[j];
        }
        
        // Save for next iteration
        memcpy(prev_block, &decoded[16 + i], 16);
      }
      
      // Remove padding
      std::vector<uint8_t> unpadded = remove_padding(decrypted.data(), decrypted.size());
      
      if (unpadded.empty()) {
        const char* error_msg = "DECRYPTION_ERROR";
        char* output = new char[strlen(error_msg) + 1];
        strcpy(output, error_msg);
        return output;
      }
      
      // Convert to string and return
      char* output = new char[unpadded.size() + 1];
      memcpy(output, unpadded.data(), unpadded.size());
      output[unpadded.size()] = '\0';
      return output;
      
    } catch (...) {
      const char* error_msg = "DECRYPTION_ERROR";
      char* output = new char[strlen(error_msg) + 1];
      strcpy(output, error_msg);
      return output;
    }
  }
}