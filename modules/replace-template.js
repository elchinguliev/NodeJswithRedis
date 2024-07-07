module.exports = (temp, data) => {
    const formattedData = data.map(item => `<div>${item}</div>`).join('');
    let output = temp.replace(/{%DATA%}/g, formattedData);
    return output;
};