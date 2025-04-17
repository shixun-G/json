var rule = {
    title: '哔影视',
    host: 'https://api.bilibili.com',
    homeUrl: '/pgc/season/rank/web/list?day=3&season_type=1',
    detailUrl: '/pgc/view/web/season?season_id=fyid',
    searchUrl: '/x/web-interface/search/type?search_type=media&keyword=**&page=fypage',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    multi: 1,
    url: '/pgc/season/rank/web/list?day=3&season_type=fyclass&page=fypage',
    filter_url: '',
    filter: {
        '1': [{
            'key': 'sort',
            'name': '排序',
            'value': [{'n': '最热', 'v': 'hot'}, {'n': '最新', 'v': 'new'}, {'n': '好评', 'v': 'good'}, {
                'n': '高分',
                'v': 'score'
            }]
        }],
        '2': [{
            'key': 'sort',
            'name': '排序',
            'value': [{'n': '最热', 'v': 'hot'}, {'n': '最新', 'v': 'new'}, {'n': '好评', 'v': 'good'}, {
                'n': '高分',
                'v': 'score'
            }]
        }],
        '3': [{
            'key': 'sort',
            'name': '排序',
            'value': [{'n': '最热', 'v': 'hot'}, {'n': '最新', 'v': 'new'}, {'n': '好评', 'v': 'good'}, {
                'n': '高分',
                'v': 'score'
            }]
        }],
        '4': [{
            'key': 'sort',
            'name': '排序',
            'value': [{'n': '最热', 'v': 'hot'}, {'n': '最新', 'v': 'new'}, {'n': '好评', 'v': 'good'}, {
                'n': '高分',
                'v': 'score'
            }]
        }]
    },
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com',
        'Cookie': ''
    },
    timeout: 5000,
    cate_exclude: '会员|游戏|全部',
    class_name: '电视剧&电影&番剧&国创',
    class_url: '1&2&3&4',
    limit: 20,

    推荐: `js:
        var d=[];
        let html=request(input);
        let json=JSON.parse(html);
        if(json.data&&json.data.list){
            for(let vod of json.data.list){
                d.push({
                    title:vod.title,
                    img:vod.cover,
                    url:vod.season_id,
                    content:vod.evaluate,
                    desc:vod.badge
                });
            }
        };
        setResult(d);
    `,

    一级: `js:
        var d=[];
        let html=request(input);
        let json=JSON.parse(html);
        if(json.data&&json.data.list){
            for(let vod of json.data.list){
                d.push({
                    title:vod.title,
                    img:vod.cover,
                    url:vod.season_id,
                    content:vod.evaluate,
                    desc:vod.badge
                });
            }
        };
        setResult(d);
    `,

    二级: `js:
    VOD = {};
    let d = [];
    let html = request(input);
    let json = JSON.parse(html);
    if (json.result) {
        VOD = {
            vod_id: input,
            vod_name: json.result.title,
            type_name: json.result.type_name,
            vod_actor: json.result.actors,
            vod_year: json.result.publish.release_date_show,
            vod_content: json.result.evaluate,
            vod_remarks: json.result.badge,
            vod_pic: json.result.cover
        };
        let eps = json.result.episodes;
        for (let ep of eps) {
            d.push({title: ep.title, url: "https://www.bilibili.com/bangumi/play/ep" + ep.ep_id});
        }
    }
    VOD.vod_play_from = "哔哩哔哩";
    VOD.vod_play_url = d.map(it => it.title + "$" + it.url).join("#");
`,

    搜索: `js:
    var d = [];
    let html = request(input);
    let json = JSON.parse(html);
    if (json.data && json.data.result) {
        for (let it of json.data.result) {
            if ([1,2,4].includes(it.media_type)) { // 番剧、电影、国创
                d.push({
                    title: it.title.replace(/<[^>]+>/g, ""),
                    img: it.cover,
                    url: it.season_id,
                    desc: it.index_show || '',
                    content: it.evaluate || ''
                });
            }
        }
    }
    setResult(d);
`,
}
