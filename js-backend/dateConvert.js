module.exports = (date, time) => {
    const [day, month, year] = date.split('/').map(Number);
    const [hour, minute] = time.split(':').map(Number);

    const unixdate = new Date(year, month - 1, day, hour, minute);

    return Math.floor(unixdate.getTime());
}