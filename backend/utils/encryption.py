import json
import base64
from Crypto.Cipher import Blowfish
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes

def get_blowfish_key(hashed_password: str) -> bytes:
    """
    Преобразует хэшированный пароль в ключ нужной длины (от 4 до 56 байт) для Blowfish.
    Если ключ длиннее 56 байт, он усекается; если короче – дополняется.
    """
    key = hashed_password.encode('utf-8')
    if len(key) < 4:
        key = key.ljust(4, b'0')
    elif len(key) > 56:
        key = key[:56]
    return key

def encrypt_data(data: dict, hashed_password: str) -> str:
    """
    Шифрует словарь (данные сессии) алгоритмом Blowfish в режиме CBC.
    Данные сначала преобразуются в JSON-строку, затем шифруются.
    Результат – base64-кодированная строка, содержащая IV и зашифрованные данные.
    """
    key = get_blowfish_key(hashed_password)
    cipher = Blowfish.new(key, Blowfish.MODE_CBC)
    plaintext = json.dumps(data).encode('utf-8')
    padded_text = pad(plaintext, Blowfish.block_size)
    ciphertext = cipher.encrypt(padded_text)
    # Сохраняем IV вместе с зашифрованными данными
    result = cipher.iv + ciphertext
    return base64.b64encode(result).decode('utf-8')

def decrypt_data(enc_data: str, hashed_password: str) -> dict:
    """
    Дешифрует зашифрованную base64-кодированную строку, получая исходный словарь.
    Извлекается IV, выполняется дешифрование и удаляется паддинг.
    """
    key = get_blowfish_key(hashed_password)
    raw = base64.b64decode(enc_data)
    iv = raw[:Blowfish.block_size]
    ciphertext = raw[Blowfish.block_size:]
    cipher = Blowfish.new(key, Blowfish.MODE_CBC, iv)
    padded_plaintext = cipher.decrypt(ciphertext)
    plaintext = unpad(padded_plaintext, Blowfish.block_size)
    return json.loads(plaintext.decode('utf-8'))
