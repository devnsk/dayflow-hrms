/**
 * Utility functions for generating employee credentials
 * 
 * Login ID Format: {CompanyCode}{FirstTwo}{LastTwo}{Year}{Serial}
 * Example: OIJODO20220001
 * - OI → Company Code (first 2 letters of company name)
 * - JODO → First 2 letters of first name + First 2 letters of last name
 * - 2022 → Year of Joining
 * - 0001 → Serial Number of Joining for that Year
 */

/**
 * Generate a random password
 * @param length - Length of the password (default: 12)
 * @returns A randomly generated password
 */
export function generatePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    const allChars = uppercase + lowercase + numbers + symbols;

    // Ensure at least one of each type
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate a Login ID for an employee
 * @param companyName - Name of the company
 * @param firstName - Employee's first name
 * @param lastName - Employee's last name
 * @param joiningYear - Year of joining
 * @param serialNumber - Serial number for that year
 * @returns Generated Login ID
 */
export function generateLoginId(
    companyName: string,
    firstName: string,
    lastName: string,
    joiningYear: number,
    serialNumber: number
): string {
    // Get first 2 letters of company name (uppercase)
    const companyCode = companyName
        .replace(/[^a-zA-Z]/g, '')
        .substring(0, 2)
        .toUpperCase();

    // Get first 2 letters of first name (uppercase)
    const firstCode = firstName
        .replace(/[^a-zA-Z]/g, '')
        .substring(0, 2)
        .toUpperCase();

    // Get first 2 letters of last name (uppercase)
    const lastCode = lastName
        .replace(/[^a-zA-Z]/g, '')
        .substring(0, 2)
        .toUpperCase();

    // Format year (4 digits)
    const yearCode = joiningYear.toString();

    // Format serial number (4 digits, zero-padded)
    const serialCode = serialNumber.toString().padStart(4, '0');

    return `${companyCode}${firstCode}${lastCode}${yearCode}${serialCode}`;
}

/**
 * Get the next serial number for a given year
 * In production, this would query the database
 * @param year - The year to get the serial for
 * @returns The next serial number
 */
export function getNextSerialNumber(year: number): number {
    // In production, this would query the database to get the count
    // of employees who joined in that year and return count + 1
    // For now, we'll return a random number for demo
    return Math.floor(Math.random() * 100) + 1;
}

/**
 * Validate Login ID format
 * @param loginId - The login ID to validate
 * @returns Whether the login ID is valid
 */
export function isValidLoginId(loginId: string): boolean {
    // Format: 2 letters (company) + 4 letters (name) + 4 digits (year) + 4 digits (serial)
    // Total: 14 characters
    const pattern = /^[A-Z]{6}\d{8}$/;
    return pattern.test(loginId);
}

/**
 * Parse a Login ID to extract its components
 * @param loginId - The login ID to parse
 * @returns Object with company code, name code, year, and serial
 */
export function parseLoginId(loginId: string): {
    companyCode: string;
    nameCode: string;
    year: number;
    serial: number;
} | null {
    if (!isValidLoginId(loginId)) {
        return null;
    }

    return {
        companyCode: loginId.substring(0, 2),
        nameCode: loginId.substring(2, 6),
        year: parseInt(loginId.substring(6, 10)),
        serial: parseInt(loginId.substring(10, 14)),
    };
}
