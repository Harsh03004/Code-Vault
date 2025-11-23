#ifndef AES_H
#define AES_H

#include <cstdint>
#include <cstring>

// AES-256 implementation
class AES {
public:
    static const int BLOCK_SIZE = 16;  // 128 bits
    static const int KEY_SIZE = 32;    // 256 bits
    static const int ROUNDS = 14;      // AES-256 uses 14 rounds

    AES(const uint8_t* key);
    void encrypt_block(const uint8_t* input, uint8_t* output);
    void decrypt_block(const uint8_t* input, uint8_t* output);

private:
    uint8_t round_keys[ROUNDS + 1][4][4];
    
    void key_expansion(const uint8_t* key);
    void add_round_key(uint8_t state[4][4], int round);
    void sub_bytes(uint8_t state[4][4]);
    void inv_sub_bytes(uint8_t state[4][4]);
    void shift_rows(uint8_t state[4][4]);
    void inv_shift_rows(uint8_t state[4][4]);
    void mix_columns(uint8_t state[4][4]);
    void inv_mix_columns(uint8_t state[4][4]);
    
    uint8_t gmul(uint8_t a, uint8_t b);
};

#endif // AES_H
