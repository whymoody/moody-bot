const { default: axios } = require("axios");
const { load } = require("cheerio"); 
const { BASE_URL } = require("../utils/config.json");
const { humanFileSize } = require("../utils");

class Scraper {
  static baseURL = BASE_URL;
  constructor() {
    if (!Scraper.baseURL) {
      throw new Error("BASE_URL is not defined.");
    }
  }

  static http = axios.create({
    baseURL: BASE_URL,
  });

  static isUrl = (url) => {
    return url.match(
      new RegExp(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/,
        "gi",
      ),
    );
  };

  static unsplash = async (query) => {
    const res = await this.http.get("/search/unsplash", {
      params: {
        q: query,
      },
    });
    return res.data;
  };


  static wallpapers = async (query) => {
    return new Promise((resolve, reject) => {
      axios
        .get(`https://www.wallpaperflare.com/search?wallpaper=${encodeURIComponent(query)}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1"
          },
          timeout: 15000 
        })
        .then((res) => {
          const $ = load(res.data);
          const results = [];
          
          $('li[itemprop="associatedMedia"]').each((index, element) => {
            const title = $(element).find('figcaption[itemprop="caption description"]').text().trim();
            const image = $(element).find('img[itemprop="contentUrl"]').attr("data-src");
            const dimensions = $(element).find("span.res").text();
            const url = $(element).find('a[itemprop="url"]').attr("href") || $(element).find('a').attr("href");
            const description = $(element).find('meta[itemprop="description"]').attr("content");
            const type = $(element).find('meta[itemprop="fileFormat"]').attr("content") || "JPG";
            const size = $(element).find('meta[itemprop="contentSize"]').attr("content");

            if (image) {
              results.push({
                title,
                size,
                dimensions,
                type,
                description,
                url: url ? (url.startsWith('http') ? url : `https://www.wallpaperflare.com${url}`) : "No disponible",
                download: image,
              });
            }
          });
          
          if (results.length > 0) {
            resolve({
              creator: "moody",
              status: true,
              data: results,
            });
          } else {
            reject("No wallpapers found");
          }
        })
        .catch((error) => reject(new Error(error).message));
    });
  };

  static soundcloud = (query) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response_search = await this.http.get("/search/soundcloud", {
          params: {
            q: query,
            limit: 1,
          },
        });
        if (!response_search.data || !response_search.data.data.length) {
          return reject({
            creator: "moody",
            status: false,
            msg: "No results found",
          });
        }
        const track = response_search.data.data[0];
        const response_download = await this.http.get("/download/soundcloud", {
          params: {
            url: track.link,
          },
        });
        resolve({
          creator: "moody",
          status: true,
          data: {
            title: track.title,
            artist: track.artist,
            genre: track.genre,
            album: track.album,
            play: track.play,
            likes: track.likes,
            comments: track.comments,
            url: track.link,
            avatar: response_download.data.data.author.avatar_url,
            image: response_download.data.data.imageURL,
            download: response_download.data.data.url,
          },
        });
      } catch (error) {
        reject({ creator: "moody", status: false, msg: error.message });
      }
    });
  };

  static getAdmins = async (participants) => {
    let admin = [];
    for (const i of participants) {
      i.admin === "superadmin"
        ? admin.push(i.id)
        : i.admin === "admin"
          ? admin.push(i.id)
          : "";
    }
    return admin || [];
  };

  static sizeFromUrl = async (url) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.isUrl(url)) {
          return reject({
            creator: "moody",
            status: false,
            msg: "Invalid URL",
          });
        }
        const res = await axios.head(url);
        const size = res.headers["content-length"];
        if (!size) {
          return reject({
            creator: "moody",
            status: false,
            msg: "Size not found",
          });
        }
        resolve({
          creator: "moody",
          status: true,
          size: Number(size),
          size_format: humanFileSize(size, true, 2),
        });
      } catch (error) {
        reject({
          creator: "moody",
          status: false,
          msg:
            error.message ||
            new Error(error).message ||
            error.toString() ||
            String(error),
        });
      }
    });
  };

  static marin_kitagawa = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await this.http.get("/anime/marin_kitagawa");
        resolve(res.data);
      } catch (er) {
        reject(new Error(er).message);
      }
    });
  };
}

module.exports = Scraper;