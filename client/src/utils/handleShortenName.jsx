export function handleShortenName(name) {
    return name.length > 20 ? name.slice(0, 20) + "..." : name;
}
