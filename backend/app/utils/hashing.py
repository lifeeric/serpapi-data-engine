"""SHA-256 hashing utilities for email addresses."""
import hashlib


def hash_email(email: str) -> str:
    """
    Hash an email address using SHA-256.
    
    This is used for creating audience lists for ad platforms
    (e.g., Facebook, Google Ads) that support hashed customer lists.
    
    Args:
        email: Email address to hash
        
    Returns:
        SHA-256 hashed email (lowercase, trimmed)
    """
    # Normalize email: lowercase and trim whitespace
    normalized_email = email.lower().strip()
    
    # Hash with SHA-256
    hashed = hashlib.sha256(normalized_email.encode('utf-8')).hexdigest()
    
    return hashed


def hash_phone(phone: str) -> str:
    """
    Hash a phone number using SHA-256.
    
    Args:
        phone: Phone number to hash
        
    Returns:
        SHA-256 hashed phone number
    """
    # Remove all non-digit characters
    normalized_phone = ''.join(filter(str.isdigit, phone))
    
    # Hash with SHA-256
    hashed = hashlib.sha256(normalized_phone.encode('utf-8')).hexdigest()
    
    return hashed
