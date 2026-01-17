from telethon.errors import SessionPasswordNeededError

async def send_otp(client, phone):
    await client.connect()
    result = await client.send_code_request(phone)
    return result.phone_code_hash

async def verify_otp(client, phone, code, phone_code_hash, password: str = None):
    await client.connect()
    
    try:
        # Attempt OTP sign in
        await client.sign_in(phone=phone, code=code, phone_code_hash=phone_code_hash)
    except SessionPasswordNeededError:
        if not password:
            # Signal to caller that 2FA password is required
            raise Exception("2FA enabled — password required")
        # Sign in using 2FA password
        await client.sign_in(password=password)