#include <emscripten.h>
#include <string>

extern "C" {
  EMSCRIPTEN_KEEPALIVE
  const char* encrypt(const char* data, const char* key) {
    std::string text(data);
    std::string password(key);
    std::string encrypted_text = "encrypted(" + text + ")-with-key(" + password + ")";

    char* result = new char[encrypted_text.length() + 1];
    strcpy(result, encrypted_text.c_str());
    return result;
  }

  EMSCRIPTEN_KEEPALIVE
  const char* decrypt(const char* data, const char* key) {
    std::string decrypted_text = "decrypted-the-data";
    char* result = new char[decrypted_text.length() + 1];
    strcpy(result, decrypted_text.c_str());
    return result;
  }
}