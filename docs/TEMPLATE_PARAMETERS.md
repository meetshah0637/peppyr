# Template Parameters Feature

## Overview

Peppyr now supports **global template parameters** that allow you to use placeholders like `{name}` and `{company}` in your templates. When you set values for these parameters, they automatically replace the placeholders in ALL your templates when you copy them.

## How It Works

### 1. Creating Templates with Parameters

When creating or editing a template, you can use placeholders in curly braces:

```
Hi {name},

I hope this message finds you well. I'm reaching out from {company}...

Best regards,
{name}
```

### 2. Setting Parameter Values

1. Click the **"Parameters"** button in the Template Library
2. Set values for your parameters (e.g., `name = "John Doe"`, `company = "Acme Corp"`)
3. Click **"Save Parameters"**

### 3. Automatic Replacement

When you copy any template:
- All `{name}` placeholders are replaced with "John Doe"
- All `{company}` placeholders are replaced with "Acme Corp"
- This happens automatically for ALL templates in your account

## Example

**Template:**
```
Hi {name},

I'm {name} from {company}. Would you be interested in learning more?

Thanks,
{name}
```

**Parameters Set:**
- `name` = "John Doe"
- `company` = "Acme Corp"

**When Copied:**
```
Hi John Doe,

I'm John Doe from Acme Corp. Would you be interested in learning more?

Thanks,
John Doe
```

## Default Parameters

The system includes these common parameters:
- `{name}` - Your Name
- `{company}` - Company Name
- `{title}` - Your Title
- `{email}` - Email
- `{phone}` - Phone
- `{website}` - Website

## Custom Parameters

You can create custom parameters:
1. Open Parameter Manager
2. Enter a parameter key (e.g., "product")
3. Set a default value
4. Use `{product}` in your templates

## Parameter Manager Features

- **Auto-detection**: Shows parameters that are actually used in your templates
- **Common parameters**: Quick access to frequently used parameters
- **Custom parameters**: Add your own parameter keys
- **Per-user**: Each user has their own parameter values
- **Persistent**: Values are saved to your account

## Technical Details

### Storage
- Parameters are stored in Firestore collection `userParameters`
- Each user has their own document: `/userParameters/{userId}`
- Values are synced across devices for logged-in users

### Replacement
- Replacement happens when copying templates (not when viewing)
- Original template text is preserved (placeholders remain in the template)
- Only the copied text has placeholders replaced

### Security
- Parameters are user-specific (isolated per account)
- Firestore security rules ensure users can only access their own parameters

## Usage Tips

1. **Use consistent parameter names**: Use lowercase with underscores (e.g., `company_name` not `Company Name`)

2. **Set defaults**: Set your most common values so you don't have to change them often

3. **Template organization**: Create templates with placeholders, then set parameter values once

4. **Quick updates**: Change a parameter value once, and it updates across all templates

## API Endpoints

- `GET /api/parameters` - Get user's parameters
- `PUT /api/parameters` - Update user's parameters

## Firestore Structure

```
userParameters/
  {userId}/
    userId: string
    parameters: {
      name: "John Doe",
      company: "Acme Corp",
      ...
    }
    updatedAt: Timestamp
```

