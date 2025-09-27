
export function getInitials(firstName = '', lastName = '') {
    if (!firstName && !lastName) return '';
    const first = firstName ? firstName[0].toUpperCase() : '';
    const last = lastName ? lastName[0].toUpperCase() : '';
    return `${first}${last}`;
}