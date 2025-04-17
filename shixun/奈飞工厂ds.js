var rule = {
  title: "奈飞工厂",
  desc: "源动力出品",
  host: "https://www.netflixgc.com",
  url: "/vodshow/fyclass-----------.html",
  searchUrl: "/vodsearch/**----------fypage---.html",
  searchable: 2,
  quickSearch: 0,
  filterable: 1,
  headers: { "User-Agent": "PC_UA" },
  timeout: 5000,
  play_parse: true,
  double: false,
  class_parse: async function () {
    const { input, pdfa, pdfh, pd } = this;
    const classes = [];
    const filters = {};
    const html = await request(input, { headers: this.headers });
    // 类处理
    let data = pdfa(html, "ul.swiper-wrapper li");
    data.forEach((it) => {
      let type_id = /\/vodshow\/(.*?)-----------\.html/g.exec(
        pdfh(it, "a&&href")
      )?.[1];
      if (!type_id) return;
      let type_name = pdfh(it, "a--em&&Text");
      if (type_name === "综艺") type_id = "23";
      if (type_name === "纪录") type_id = "24";
      if (["首页", "论理", "排行榜", "留言板"].includes(type_name)) return;
      classes.push({ type_id, type_name });
    });

    // 筛选处理
    const htmlUrl = classes.map((item) => ({
      url: `${this.host}/vodshow/${item.type_id}-----------.html`,
      options: { timeout: 5000, headers: this.headers },
    }));
    const htmlArr = await batchFetch(htmlUrl);
    htmlArr.forEach((it, i) => {
      const type_id = classes[i].type_id;
      const data = pdfa(it, ".ec-casc-list .nav-swiper");
      const categories = [
        { key: "class", name: "类型" },
        { key: "area", name: "地区" },
        { key: "year", name: "年份" },
        { key: "lang", name: "语言" },
        { key: "letter", name: "字母" },
      ];
      filters[type_id] = categories.map((category) => {
        const filteredData =
          data.filter((item) => item.includes(category.name))[0] || [];
        const values = pdfa(filteredData, "ul li").map((it) => {
          const nv = pdfh(it, "a&&Text");
          return {
            n: nv || "全部",
            v: nv === "全部" ? "" : nv,
          };
        });
        return { key: category.key, name: category.name, value: values };
      });
      filters[type_id] = filters[type_id].filter(
        (item) => item.value && item.value.length > 0
      );
    });
    return { class: classes, filters };
  },
  推荐: async function (tid, pg, filter, extend) {
    const { input, pdfa, pdfh, pd } = this;
    const html = await request(input, { headers: this.headers });
    const d = [];
    const data = pdfa(html, ".list-swiper .public-list-box");
    data.forEach((it) => {
      d.push({
        title: pdfh(it, ".public-list-button a&&title"),
        pic_url: pdfh(it, ".public-list-div img&&data-src"),
        desc: pdfh(it, ".public-list-div .public-prt&&Text"),
        url: /detail\/(.*?)\.html/g.exec(
          pdfh(it, ".public-list-button a&&href")
        )[1],
      });
    });
    return setResult(d);
  },
  一级: async function (tid, pg, filter, extend) {
    const date = Math.ceil(new Date().getTime() / 1000);
    const key = this.generateKey(date);
    const url = `${this.host}/index.php/api/vod`;
    const html = await request(url, {
      method: "POST",
      headers: {
        ...this.headers,
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      data: {
        type: tid,
        page: pg,
        time: date,
        key: key,
        ...extend,
      },
    });
    const response = JSON.parse(html);
    return response.list;
  },
  二级: async function (ids) {
    const { input, pdfa, pdfh, pd } = this;
    const url = `${this.host}/detail/${ids[0]}.html`;
    const html = await request(url, { headers: this.headers });
    const detail = pdfa(html, ".detail-info .slide-info");
    const vod = {
      vod_id: ids[0],
      vod_name: pdfh(html, ".detail-info h3.slide-info-title&&Text"),
      vod_content: pdfh(html, "#height_limit&&Text"),
      vod_pic: pdfh(html, ".detail-pic img&&data-src"),
      type_name: (() => {
        const it = detail.filter((item) => item.includes("类型"))[0];
        if (!it) return "";
        return pdfa(it, "a")
          .map((item) => pdfh(item, "a&&Text"))
          .join(",");
      })(),
      vod_actor: (() => {
        const it = detail.filter((item) => item.includes("演员"))[0];
        if (!it) return "";
        return pdfa(it, "a")
          .map((item) => pdfh(item, "a&&Text"))
          .join(",");
      })(),
      vod_remarks: (() => {
        const it = detail.filter((item) =>
          item.includes("slide-info-remarks")
        )[0];
        const spans = pdfa(it, "span");
        if (!it || spans.length <= 1) return "";
        return pdfh(spans[0], "span&&Text")?.trim();
      })(),
      vod_year: (() => {
        const it = detail.filter((item) =>
          item.includes("slide-info-remarks")
        )[0];
        const spans = pdfa(it, "span");
        if (!it || spans.length <= 2) return "";
        return pdfh(spans[1], "span&&Text")?.trim();
      })(),
    };

    let playFroms = [];
    let playUrls = [];

    const playList = pdfa(html, ".anthology .anthology-tab .swiper-wrapper a");
    playList.forEach((it) => {
      playFroms.push(pdfh(it, "a--i--span&&Text"));
    });

    const indexList = pdfa(
      html,
      ".anthology .anthology-list .anthology-list-box"
    );
    indexList.forEach((lines) => {
      const tmpUrls = [];
      const line = pdfa(lines, "ul li");
      line.forEach((play) => {
        const index = pdfh(play, "a&&Text");
        const url = pdfh(play, "a&&href");
        tmpUrls.push(`${index}$${url}`);
      });
      playUrls.push(tmpUrls.join("#"));
    });

    const tabExclude = ["APP独享(下载APP观影)"];
    tabExclude.forEach((it) => {
      const tabIndex = playFroms.indexOf(it);
      console.warn(it, tabIndex)
      if (tabIndex === -1) return;
      playFroms = playFroms.filter((_, index) => index !== tabIndex);
      playUrls = playUrls.filter((_, index) => index !== tabIndex);
    });

    vod.vod_play_from = playFroms.join("$$$");
    vod.vod_play_url = playUrls.join("$$$");

    return vod;
  },
  搜索: async function (wd, quick, pg) {
    const { input, pdfa, pdfh, pd } = this;
    const html = await request(input, { headers: this.headers });
    let d = [];
    let data = pdfa(html, ".box-width .row-9 .search-box");
    data.forEach((it) => {
      d.push({
        title: pdfh(it, ".right .thumb-content .thumb-txt&&Text"),
        pic_url: pdfh(it, ".left a img&&data-src"),
        desc: pdfh(it, ".left a .public-list-prb&&Text"),
        url: pdfh(it, ".left a&&href"),
      });
    });
    return setResult(d);
  },
  lazy: async function (flag, id, flags) {
    const { input, pdfa, pdfh, pd } = this;
    const url = `${this.host}${id}`;
    try {
      // 第一步：获取视频id
      const html = await request(url, {
        headers: { ...this.headers, referer: url },
      });
      const script = pdfa(html, ".player-left script");
      const content = script.filter((e) => e.includes("player_aaaa"))[0];
      if (!content) return { parse: 1, url };
      const scriptRegex = /var player_aaaa=({[^;]+})/;
      const match = content.match(scriptRegex);
      if (!match || !match[1]) return { parse: 1, url };
      const matchStr = match[1];
      let player_data = JSON.parse(matchStr);
      if (player_data.encrypt === 1) {
        player_data.url = unescape(player_data.url);
      } else if (player_data.encrypt === 2) {
        player_data.url = unescape(base64Decode(player_data.url));
      }
      const playerDataUrl = player_data.url;
      const playerDataFrom = player_data.from;
      console.warn(`playerDataUrl`, playerDataUrl);

      // 第二步: 获取映射列表
      const urlPlayConfig = `${this.host
        }/static/js/playerconfig.js?t=${this.formatDate()}`;
      console.warn("urlPlayConfig", urlPlayConfig);
      const htmlPlayConfig = await request(urlPlayConfig, {
        headers: { ...this.headers, referer: url },
      });
      eval(htmlPlayConfig);
      const parseUrl = MacPlayerConfig.player_list[playerDataFrom].parse;

      // 第三步: 获取解密密钥
      const urlPlayer = `${parseUrl}${playerDataUrl}`;
      const htmlPlayer = await request(urlPlayer, {
        headers: { ...this.headers, referer: this.host },
      });
      const scriptPlayer = pdfa(htmlPlayer, "body script");
      const contentPlayer = scriptPlayer.filter((e) => e.includes("ConFig"))[0];
      if (!contentPlayer) return { parse: 1, url: url };
      const scriptRegexPlayer = /ConFig\s*=\s*({[\s\S]*?})\s*,\s*box\s*=\s*/;
      const matchPlayer = contentPlayer.match(scriptRegexPlayer);
      if (!matchPlayer || !matchPlayer[1]) return { parse: 1, url };
      const matchStrPlayer = matchPlayer[1];
      let ConFig = JSON.parse(matchStrPlayer);
      const encodeUrlPlayer = ConFig.url;
      const uid = ConFig.config.uid;
      console.warn("encodeUrlPlayer", encodeUrlPlayer);
      console.warn("uid", uid);

      // 第四步：解密url
      const decrypted = CryptoJS.AES.decrypt(
        encodeUrlPlayer,
        CryptoJS.enc.Utf8.parse(`2890${uid}tB959C`),
        {
          iv: CryptoJS.enc.Utf8.parse("2F131BE91247866E"),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );
      const decodeUrlPlayer = decrypted.toString(CryptoJS.enc.Utf8);
      console.warn("decodeUrlPlayer", decodeUrlPlayer);

      // 第五步：判断最终url
      if (/m3u8|mp4|flv|mpd/.test(decodeUrlPlayer)) {
        return { parse: 0, url: decodeUrlPlayer };
      } else {
        return { parse: 1, url };
      }
    } catch {
      return { parse: 1, url };
    }
  },
  generateKey: function (timestamp) {
    const uid = "DCC147D11943AF75";
    const plainText = "DS" + timestamp.toString() + uid;
    const key = md5(plainText);
    return key;
  },
  formatDate: function () {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  },
};
