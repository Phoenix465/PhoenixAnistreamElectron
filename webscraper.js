const axios = require('axios');

module.exports = {
    GetLatestData: GetLatestData
}

const headers = {
    "User-Agent": 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36'
}

async function get(url) {
    const config = {
        method: 'get',
        url: url,
        headers: headers
    };

    return axios(config);
}

async function GetLatestData() {
    const url = "https://www1.gogoanime.cm";
    var recentlyAddedRegex = new RegExp(
        `<div class=\"img\">
        \\s*<a href=\"(?:.*?)\" title=\"(.*?)\">
        \\s*<img src=\"(.*?)\" alt=\"(?:.*?)\" \/>
        \\s*<div class=\"type ic-SUB\"><\/div>
        \\s*<\/a>
        \\s*<\/div>
        \\s*<p class=\"name\"><a href=\"(?:.*?)\" title=\"(?:.*?)\">(?:.*?)<\/a><\/p>
        \\s*<p class=\"episode\">Episode (.*?)<\/p>`,

        'gm'
    )

    const urlRequest = await get(url);
    let recentlyAddedAnimeData = [];

    if (urlRequest.status === 200) {
        const content = urlRequest.data

        // var hrTime = process.hrtime();
        // let s = hrTime[0] * 1000000 + hrTime[1] / 1000;

        let m;

        while ((m = recentlyAddedRegex.exec(content)) !== null) {
            if (m.index === recentlyAddedRegex.lastIndex) {
                recentlyAddedRegex.lastIndex++;
            }

            let animeData = {};
            const groupNames = ["name", "thumbnail", "episode", "anime-link"];
            m.forEach((match, groupIndex) => {
                if (groupIndex === 0) {
                    return;
                }
                animeData[groupNames[groupIndex - 1]] = match;
            });
            animeData[groupNames[3]] = `https://www1.gogoanime.cm/category/${animeData[groupNames[1]].split("/").at(-1).split(".")[0]}`;

            recentlyAddedAnimeData.push(animeData);
        }

        // var hrTime = process.hrtime();
        // let e = (hrTime[0] * 1000000 + hrTime[1] / 1000) - s;
        // console.log(`Time Taken ${e/1000}ms`)
    }

    return recentlyAddedAnimeData;
}
