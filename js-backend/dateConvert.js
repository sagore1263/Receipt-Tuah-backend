module.exports = (date, time) => {
    const [day, month, year] = date.split('/').map(Number);
    const [hour, minute] = time.split(':').map(Number);

    const date = new Date(year, month - 1, day, hour, minute);

    return Math.floor(date.getTime());
}