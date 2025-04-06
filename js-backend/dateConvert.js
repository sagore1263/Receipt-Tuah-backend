function dateConvert(date, time) {
    const [day, month, year] = date.split('/').map(Number);
    if (year === undefined) throw new Error('Invalid date format');
    
    const [hour, minute] = time.split(':').map(Number);

    const unixdate = new Date(year, month - 1, day, hour, minute);

    return Math.floor(unixdate.getTime());
}

module.exports = (date, time) => {
    return time ? dateConvert(date, time) : dateConvert(date, '00:00');
};