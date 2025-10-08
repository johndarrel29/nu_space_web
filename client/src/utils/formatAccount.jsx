export function isValidAdminEmail(email) {
    if (!email) return 'Email is required.';


    if (!/^[a-zA-Z]+@national-u\.edu\.ph$/.test(email)) {
        if (!email.endsWith("@national-u.edu.ph")) {
            return "Email must end with @national-u.edu.ph.";
        }
        if (!/^[a-zA-Z]+/.test(email.split("@")[0])) {
            return "Email username must contain only letters (no numbers or special characters).";
        }
        // if email contains invalid characters
        if (/[^a-zA-Z0-9._%+-]/.test(email)) {
            return "Email contains invalid characters.";
        }
        return "Invalid admin email format.";
    }
    return null;
}

export function isValidStudentEmail(email) {
    if (!email) return false;
    if (!/^[a-zA-Z]+@students\.national-u\.edu\.ph$/.test(email)) {
        if (!email.endsWith("@students.national-u.edu.ph")) {
            return "Email must end with @students.national-u.edu.ph.";
        }
        if (!/^[a-zA-Z]+/.test(email.split("@")[0])) {
            return "Email username must contain only letters (no numbers or special characters).";
        }

        // if email contains invalid characters
        if (/[^a-zA-Z0-9._%+-]/.test(email)) {
            return "Email contains invalid characters.";
        }
        return "Invalid student email format.";
    }
    return null;
}