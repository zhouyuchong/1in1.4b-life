import fs from 'fs';
import path from 'path';

// Complete list of provinces and all prefecture-level divisions in China with realistic estimates
const rawProvinces = [
  {
    province: "北京市",
    tier: "一线城市",
    gaokao: "优待相对较高",
    urbanRate: 0.87,
    gdpLevel: "超高",
    cities: [
      { name: "北京市核心区(东城/西城)", weight: 18, tier: "一线核心", urbanRate: 1.0 },
      { name: "北京市城四区(海淀/朝阳/丰台/石景山)", weight: 65, tier: "一线核心", urbanRate: 0.98 },
      { name: "北京市近郊与远郊(昌平/大兴/通州/顺义/房山/门头沟/怀柔/平谷/密云/延庆)", weight: 45, tier: "一线郊区", urbanRate: 0.78 }
    ]
  },
  {
    province: "上海市",
    tier: "一线城市",
    gaokao: "优待相对较高",
    urbanRate: 0.89,
    gdpLevel: "超高",
    cities: [
      { name: "上海市核心区(黄浦/徐汇/静安/长宁/普陀/虹口/杨浦)", weight: 40, tier: "一线核心", urbanRate: 1.0 },
      { name: "上海市浦东新区", weight: 45, tier: "一线核心", urbanRate: 0.92 },
      { name: "上海市郊区(闵行/宝山/嘉定/松江/青浦/奉贤/金山/崇明)", weight: 55, tier: "一线郊区", urbanRate: 0.82 }
    ]
  },
  {
    province: "天津市",
    tier: "新一线",
    gaokao: "优待相对较高",
    urbanRate: 0.85,
    gdpLevel: "高",
    cities: [
      { name: "天津市中心城区(和平/河西/南开/河东/河北/红桥)", weight: 35, tier: "新一线", urbanRate: 1.0 },
      { name: "天津市滨海新区", weight: 30, tier: "新一线", urbanRate: 0.88 },
      { name: "天津市环城与远郊区(西青/津南/北辰/东丽/武清/宝坻/宁河/静海/蓟州)", weight: 45, tier: "二线", urbanRate: 0.72 }
    ]
  },
  {
    province: "重庆市",
    tier: "新一线",
    gaokao: "中等偏难",
    urbanRate: 0.71,
    gdpLevel: "中等",
    cities: [
      { name: "重庆市中心城区(渝中/江北/渝北/沙坪坝/九龙坡/南岸/大渡口/巴南/北碚)", weight: 95, tier: "新一线", urbanRate: 0.95 },
      { name: "重庆市主城新区(江津/合川/永川/璧山/铜梁/大足/荣昌/綦江)", weight: 80, tier: "三线", urbanRate: 0.65 },
      { name: "重庆市渝东北三峡库区(万州/开州/梁平/忠县/奉节/云阳/巫山/巫溪/城口)", weight: 70, tier: "四线", urbanRate: 0.52 },
      { name: "重庆市渝东南山区(黔江/武隆/石柱/秀山/酉阳/彭水)", weight: 35, tier: "五线", urbanRate: 0.45 }
    ]
  },
  {
    province: "广东省",
    tier: "经济第一大省·出生大省",
    gaokao: "千军万马",
    urbanRate: 0.75,
    gdpLevel: "高",
    cities: [
      { name: "广州市", weight: 160, tier: "一线城市", urbanRate: 0.86, gdpLevel: "超高" },
      { name: "深圳市", weight: 170, tier: "一线城市", urbanRate: 0.99, gdpLevel: "超高" },
      { name: "佛山市", weight: 90, tier: "新一线", urbanRate: 0.95, gdpLevel: "高" },
      { name: "东莞市", weight: 95, tier: "新一线", urbanRate: 0.92, gdpLevel: "高" },
      { name: "珠海市", weight: 28, tier: "二线", urbanRate: 0.90, gdpLevel: "高" },
      { name: "中山市", weight: 42, tier: "二线", urbanRate: 0.88, gdpLevel: "高" },
      { name: "惠州市", weight: 58, tier: "二线", urbanRate: 0.73, gdpLevel: "中等" },
      { name: "江门市", weight: 42, tier: "三线", urbanRate: 0.68, gdpLevel: "中等" },
      { name: "湛江市", weight: 85, tier: "三线", urbanRate: 0.47, gdpLevel: "偏低" },
      { name: "茂名市", weight: 80, tier: "三线", urbanRate: 0.45, gdpLevel: "偏低" },
      { name: "肇庆市", weight: 38, tier: "三线", urbanRate: 0.51, gdpLevel: "中等" },
      { name: "清远市", weight: 45, tier: "三线", urbanRate: 0.55, gdpLevel: "中等" },
      { name: "韶关市", weight: 28, tier: "四线", urbanRate: 0.58, gdpLevel: "偏低" },
      { name: "梅州市", weight: 42, tier: "四线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "汕头市", weight: 58, tier: "三线", urbanRate: 0.71, gdpLevel: "中等" },
      { name: "潮州市", weight: 28, tier: "四线", urbanRate: 0.66, gdpLevel: "偏低" },
      { name: "揭阳市", weight: 70, tier: "三线", urbanRate: 0.53, gdpLevel: "偏低" },
      { name: "汕尾市", weight: 35, tier: "四线", urbanRate: 0.56, gdpLevel: "偏低" },
      { name: "河源市", weight: 30, tier: "四线", urbanRate: 0.50, gdpLevel: "偏低" },
      { name: "阳江市", weight: 28, tier: "四线", urbanRate: 0.55, gdpLevel: "中等" },
      { name: "云浮市", weight: 26, tier: "五线", urbanRate: 0.45, gdpLevel: "偏低" }
    ]
  },
  {
    province: "河南省",
    tier: "人口与高考地狱大省",
    gaokao: "地狱模式",
    urbanRate: 0.57,
    gdpLevel: "中等",
    cities: [
      { name: "郑州市", weight: 110, tier: "新一线", urbanRate: 0.79, gdpLevel: "高" },
      { name: "周口市", weight: 95, tier: "三线", urbanRate: 0.44, gdpLevel: "偏低" },
      { name: "南阳市", weight: 105, tier: "三线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "商丘市", weight: 80, tier: "三线", urbanRate: 0.48, gdpLevel: "偏低" },
      { name: "信阳市", weight: 65, tier: "三线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "洛阳市", weight: 68, tier: "二线", urbanRate: 0.66, gdpLevel: "中等" },
      { name: "新乡市", weight: 58, tier: "三线", urbanRate: 0.59, gdpLevel: "中等" },
      { name: "驻马店市", weight: 70, tier: "三线", urbanRate: 0.46, gdpLevel: "偏低" },
      { name: "安阳市", weight: 50, tier: "三线", urbanRate: 0.54, gdpLevel: "偏低" },
      { name: "平顶山市", weight: 45, tier: "三线", urbanRate: 0.56, gdpLevel: "中等" },
      { name: "开封市", weight: 46, tier: "三线", urbanRate: 0.53, gdpLevel: "偏低" },
      { name: "焦作市", weight: 35, tier: "三线", urbanRate: 0.63, gdpLevel: "中等" },
      { name: "许昌市", weight: 45, tier: "三线", urbanRate: 0.55, gdpLevel: "中等" },
      { name: "濮阳市", weight: 38, tier: "四线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "漯河市", weight: 26, tier: "四线", urbanRate: 0.56, gdpLevel: "中等" },
      { name: "三门峡市", weight: 22, tier: "四线", urbanRate: 0.59, gdpLevel: "中等" },
      { name: "鹤壁市", weight: 16, tier: "四线", urbanRate: 0.62, gdpLevel: "中等" },
      { name: "济源市", weight: 8, tier: "五线", urbanRate: 0.68, gdpLevel: "中等" }
    ]
  },
  {
    province: "山东省",
    tier: "人口与考公大省",
    gaokao: "地狱模式",
    urbanRate: 0.64,
    gdpLevel: "高",
    cities: [
      { name: "青岛市", weight: 85, tier: "新一线", urbanRate: 0.77, gdpLevel: "高" },
      { name: "济南市", weight: 80, tier: "二线", urbanRate: 0.74, gdpLevel: "高" },
      { name: "临沂市", weight: 105, tier: "三线", urbanRate: 0.56, gdpLevel: "偏低" },
      { name: "潍坊市", weight: 85, tier: "二线", urbanRate: 0.65, gdpLevel: "中等" },
      { name: "烟台市", weight: 58, tier: "二线", urbanRate: 0.68, gdpLevel: "高" },
      { name: "菏泽市", weight: 88, tier: "三线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "济宁市", weight: 75, tier: "三线", urbanRate: 0.61, gdpLevel: "中等" },
      { name: "泰安市", weight: 48, tier: "三线", urbanRate: 0.64, gdpLevel: "中等" },
      { name: "德州市", weight: 52, tier: "三线", urbanRate: 0.55, gdpLevel: "偏低" },
      { name: "聊城市", weight: 56, tier: "三线", urbanRate: 0.54, gdpLevel: "偏低" },
      { name: "滨州市", weight: 38, tier: "四线", urbanRate: 0.59, gdpLevel: "中等" },
      { name: "淄博市", weight: 42, tier: "三线", urbanRate: 0.74, gdpLevel: "中等" },
      { name: "东营市", weight: 22, tier: "四线", urbanRate: 0.72, gdpLevel: "超高" },
      { name: "威海市", weight: 25, tier: "三线", urbanRate: 0.71, gdpLevel: "高" },
      { name: "枣庄市", weight: 38, tier: "四线", urbanRate: 0.61, gdpLevel: "偏低" },
      { name: "日照市", weight: 28, tier: "四线", urbanRate: 0.62, gdpLevel: "中等" }
    ]
  },
  {
    province: "江苏省",
    tier: "经济强省·苏南苏北差异",
    gaokao: "极高难度",
    urbanRate: 0.74,
    gdpLevel: "超高",
    cities: [
      { name: "苏州市", weight: 95, tier: "新一线", urbanRate: 0.82, gdpLevel: "超高" },
      { name: "南京市", weight: 75, tier: "新一线", urbanRate: 0.87, gdpLevel: "超高" },
      { name: "无锡市", weight: 58, tier: "二线", urbanRate: 0.83, gdpLevel: "超高" },
      { name: "常州市", weight: 45, tier: "二线", urbanRate: 0.78, gdpLevel: "高" },
      { name: "南通市", weight: 60, tier: "二线", urbanRate: 0.71, gdpLevel: "高" },
      { name: "徐州市", weight: 80, tier: "二线", urbanRate: 0.66, gdpLevel: "中等" },
      { name: "扬州市", weight: 38, tier: "二线", urbanRate: 0.71, gdpLevel: "高" },
      { name: "盐城市", weight: 56, tier: "三线", urbanRate: 0.65, gdpLevel: "中等" },
      { name: "泰州市", weight: 38, tier: "三线", urbanRate: 0.68, gdpLevel: "高" },
      { name: "镇江市", weight: 26, tier: "三线", urbanRate: 0.79, gdpLevel: "高" },
      { name: "淮安市", weight: 45, tier: "三线", urbanRate: 0.65, gdpLevel: "中等" },
      { name: "连云港市", weight: 42, tier: "三线", urbanRate: 0.62, gdpLevel: "偏低" },
      { name: "宿迁市", weight: 48, tier: "三线", urbanRate: 0.61, gdpLevel: "偏低" }
    ]
  },
  {
    province: "浙江省",
    tier: "民富第一省",
    gaokao: "竞争激烈",
    urbanRate: 0.73,
    gdpLevel: "超高",
    cities: [
      { name: "杭州市", weight: 95, tier: "新一线", urbanRate: 0.84, gdpLevel: "超高" },
      { name: "宁波市", weight: 72, tier: "新一线", urbanRate: 0.79, gdpLevel: "超高" },
      { name: "温州市", weight: 85, tier: "二线", urbanRate: 0.73, gdpLevel: "高" },
      { name: "金华市", weight: 62, tier: "二线", urbanRate: 0.69, gdpLevel: "高" },
      { name: "台州市", weight: 55, tier: "二线", urbanRate: 0.64, gdpLevel: "高" },
      { name: "嘉兴市", weight: 46, tier: "二线", urbanRate: 0.72, gdpLevel: "高" },
      { name: "绍兴市", weight: 45, tier: "二线", urbanRate: 0.72, gdpLevel: "高" },
      { name: "湖州市", weight: 30, tier: "三线", urbanRate: 0.66, gdpLevel: "高" },
      { name: "衢州市", weight: 22, tier: "四线", urbanRate: 0.58, gdpLevel: "中等" },
      { name: "丽水市", weight: 22, tier: "四线", urbanRate: 0.63, gdpLevel: "中等" },
      { name: "舟山市", weight: 10, tier: "四线", urbanRate: 0.74, gdpLevel: "高" }
    ]
  },
  {
    province: "四川省",
    tier: "人口大省·强省会与地州",
    gaokao: "极高难度",
    urbanRate: 0.57,
    gdpLevel: "中等",
    cities: [
      { name: "成都市", weight: 160, tier: "新一线", urbanRate: 0.79, gdpLevel: "高" },
      { name: "绵阳市", weight: 45, tier: "三线", urbanRate: 0.54, gdpLevel: "中等" },
      { name: "南充市", weight: 62, tier: "三线", urbanRate: 0.51, gdpLevel: "偏低" },
      { name: "宜宾市", weight: 48, tier: "三线", urbanRate: 0.53, gdpLevel: "中等" },
      { name: "泸州市", weight: 42, tier: "三线", urbanRate: 0.52, gdpLevel: "中等" },
      { name: "达州市", weight: 55, tier: "三线", urbanRate: 0.48, gdpLevel: "偏低" },
      { name: "德阳市", weight: 32, tier: "三线", urbanRate: 0.57, gdpLevel: "中等" },
      { name: "广安市", weight: 36, tier: "四线", urbanRate: 0.45, gdpLevel: "偏低" },
      { name: "乐山市", weight: 32, tier: "三线", urbanRate: 0.54, gdpLevel: "中等" },
      { name: "内江市", weight: 36, tier: "四线", urbanRate: 0.50, gdpLevel: "偏低" },
      { name: "眉山市", weight: 30, tier: "四线", urbanRate: 0.51, gdpLevel: "中等" },
      { name: "自贡市", weight: 25, tier: "四线", urbanRate: 0.56, gdpLevel: "中等" },
      { name: "遂宁市", weight: 30, tier: "四线", urbanRate: 0.50, gdpLevel: "偏低" },
      { name: "巴中市", weight: 32, tier: "五线", urbanRate: 0.44, gdpLevel: "偏低" },
      { name: "资阳市", weight: 25, tier: "四线", urbanRate: 0.43, gdpLevel: "偏低" },
      { name: "广元市", weight: 24, tier: "四线", urbanRate: 0.48, gdpLevel: "偏低" },
      { name: "雅安市", weight: 14, tier: "五线", urbanRate: 0.53, gdpLevel: "中等" },
      { name: "攀枝花市", weight: 12, tier: "四线", urbanRate: 0.70, gdpLevel: "高" },
      { name: "凉山彝族自治州", weight: 65, tier: "五线", urbanRate: 0.38, gdpLevel: "偏低" },
      { name: "阿坝藏族羌族自治州", weight: 10, tier: "五线", urbanRate: 0.42, gdpLevel: "偏低" },
      { name: "甘孜藏族自治州", weight: 12, tier: "五线", urbanRate: 0.33, gdpLevel: "偏低" }
    ]
  },
  {
    province: "河北省",
    tier: "京畿重地·高考衡水卷王",
    gaokao: "地狱模式",
    urbanRate: 0.61,
    gdpLevel: "中等",
    cities: [
      { name: "石家庄市", weight: 95, tier: "二线", urbanRate: 0.71, gdpLevel: "中等" },
      { name: "保定市", weight: 98, tier: "二线", urbanRate: 0.58, gdpLevel: "偏低" },
      { name: "邯郸市", weight: 85, tier: "三线", urbanRate: 0.59, gdpLevel: "偏低" },
      { name: "唐山市", weight: 68, tier: "二线", urbanRate: 0.65, gdpLevel: "高" },
      { name: "沧州市", weight: 68, tier: "三线", urbanRate: 0.59, gdpLevel: "中等" },
      { name: "邢台市", weight: 65, tier: "三线", urbanRate: 0.55, gdpLevel: "偏低" },
      { name: "廊坊市", weight: 48, tier: "三线", urbanRate: 0.66, gdpLevel: "中等" },
      { name: "张家口市", weight: 36, tier: "四线", urbanRate: 0.59, gdpLevel: "偏低" },
      { name: "承德市", weight: 32, tier: "四线", urbanRate: 0.54, gdpLevel: "偏低" },
      { name: "秦皇岛市", weight: 28, tier: "三线", urbanRate: 0.64, gdpLevel: "中等" },
      { name: "衡水市", weight: 42, tier: "四线", urbanRate: 0.56, gdpLevel: "偏低" }
    ]
  },
  {
    province: "湖北省",
    tier: "九省通衢·科教大省",
    gaokao: "极高难度",
    urbanRate: 0.64,
    gdpLevel: "高",
    cities: [
      { name: "武汉市", weight: 110, tier: "新一线", urbanRate: 0.84, gdpLevel: "高" },
      { name: "襄阳市", weight: 52, tier: "三线", urbanRate: 0.63, gdpLevel: "高" },
      { name: "宜昌市", weight: 40, tier: "三线", urbanRate: 0.65, gdpLevel: "高" },
      { name: "荆州市", weight: 50, tier: "三线", urbanRate: 0.58, gdpLevel: "中等" },
      { name: "黄冈市", weight: 62, tier: "三线", urbanRate: 0.50, gdpLevel: "偏低" },
      { name: "孝感市", weight: 46, tier: "三线", urbanRate: 0.60, gdpLevel: "中等" },
      { name: "十堰市", weight: 32, tier: "四线", urbanRate: 0.59, gdpLevel: "中等" },
      { name: "荆门市", weight: 26, tier: "四线", urbanRate: 0.60, gdpLevel: "中等" },
      { name: "黄石市", weight: 24, tier: "四线", urbanRate: 0.66, gdpLevel: "中等" },
      { name: "咸宁市", weight: 28, tier: "四线", urbanRate: 0.56, gdpLevel: "偏低" },
      { name: "随州市", weight: 22, tier: "四线", urbanRate: 0.54, gdpLevel: "偏低" },
      { name: "鄂州市", weight: 12, tier: "四线", urbanRate: 0.67, gdpLevel: "高" },
      { name: "恩施土家族苗族自治州", weight: 36, tier: "五线", urbanRate: 0.46, gdpLevel: "偏低" },
      { name: "省直辖县级行政区(仙桃/天门/潜江/神农架)", weight: 30, tier: "四线", urbanRate: 0.58, gdpLevel: "中等" }
    ]
  },
  {
    province: "湖南省",
    tier: "中部重镇·吃得苦霸得蛮",
    gaokao: "极高难度",
    urbanRate: 0.60,
    gdpLevel: "中等",
    cities: [
      { name: "长沙市", weight: 95, tier: "新一线", urbanRate: 0.83, gdpLevel: "高" },
      { name: "衡阳市", weight: 68, tier: "三线", urbanRate: 0.55, gdpLevel: "偏低" },
      { name: "邵阳市", weight: 70, tier: "三线", urbanRate: 0.51, gdpLevel: "偏低" },
      { name: "岳阳市", weight: 50, tier: "三线", urbanRate: 0.61, gdpLevel: "中等" },
      { name: "常德市", weight: 50, tier: "三线", urbanRate: 0.57, gdpLevel: "中等" },
      { name: "株洲市", weight: 38, tier: "三线", urbanRate: 0.72, gdpLevel: "高" },
      { name: "郴州市", weight: 46, tier: "四线", urbanRate: 0.58, gdpLevel: "中等" },
      { name: "湘潭市", weight: 28, tier: "三线", urbanRate: 0.65, gdpLevel: "高" },
      { name: "永州市", weight: 52, tier: "四线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "益阳市", weight: 40, tier: "四线", urbanRate: 0.54, gdpLevel: "偏低" },
      { name: "娄底市", weight: 38, tier: "四线", urbanRate: 0.48, gdpLevel: "偏低" },
      { name: "怀化市", weight: 45, tier: "四线", urbanRate: 0.49, gdpLevel: "偏低" },
      { name: "湘西土家族苗族自治州", weight: 26, tier: "五线", urbanRate: 0.48, gdpLevel: "偏低" },
      { name: "张家界市", weight: 14, tier: "五线", urbanRate: 0.51, gdpLevel: "偏低" }
    ]
  },
  {
    province: "安徽省",
    tier: "长三角腹地",
    gaokao: "极高难度",
    urbanRate: 0.60,
    gdpLevel: "中等",
    cities: [
      { name: "合肥市", weight: 90, tier: "新一线", urbanRate: 0.84, gdpLevel: "高" },
      { name: "阜阳市", weight: 90, tier: "三线", urbanRate: 0.44, gdpLevel: "偏低" },
      { name: "宿州市", weight: 55, tier: "四线", urbanRate: 0.45, gdpLevel: "偏低" },
      { name: "亳州市", weight: 58, tier: "四线", urbanRate: 0.43, gdpLevel: "偏低" },
      { name: "六安市", weight: 48, tier: "四线", urbanRate: 0.50, gdpLevel: "偏低" },
      { name: "安庆市", weight: 45, tier: "三线", urbanRate: 0.53, gdpLevel: "偏低" },
      { name: "芜湖市", weight: 36, tier: "二线", urbanRate: 0.73, gdpLevel: "高" },
      { name: "滁州市", weight: 40, tier: "三线", urbanRate: 0.61, gdpLevel: "中等" },
      { name: "蚌埠市", weight: 32, tier: "三线", urbanRate: 0.58, gdpLevel: "中等" },
      { name: "淮南市", weight: 28, tier: "四线", urbanRate: 0.64, gdpLevel: "偏低" },
      { name: "马鞍山市", weight: 22, tier: "三线", urbanRate: 0.74, gdpLevel: "高" },
      { name: "宣城市", weight: 26, tier: "四线", urbanRate: 0.61, gdpLevel: "中等" },
      { name: "淮北市", weight: 20, tier: "四线", urbanRate: 0.66, gdpLevel: "中等" },
      { name: "铜陵市", weight: 15, tier: "四线", urbanRate: 0.67, gdpLevel: "中等" },
      { name: "池州市", weight: 14, tier: "五线", urbanRate: 0.60, gdpLevel: "中等" },
      { name: "黄山市", weight: 14, tier: "四线", urbanRate: 0.55, gdpLevel: "中等" }
    ]
  },
  {
    province: "福建省",
    tier: "东南沿海·爱拼才会赢",
    gaokao: "中等难度",
    urbanRate: 0.70,
    gdpLevel: "高",
    cities: [
      { name: "福州市", weight: 70, tier: "二线", urbanRate: 0.73, gdpLevel: "高" },
      { name: "厦门市", weight: 52, tier: "二线", urbanRate: 0.90, gdpLevel: "超高" },
      { name: "泉州市", weight: 85, tier: "二线", urbanRate: 0.70, gdpLevel: "高" },
      { name: "漳州市", weight: 48, tier: "三线", urbanRate: 0.63, gdpLevel: "中等" },
      { name: "莆田市", weight: 35, tier: "三线", urbanRate: 0.64, gdpLevel: "中等" },
      { name: "宁德市", weight: 32, tier: "三线", urbanRate: 0.60, gdpLevel: "高" },
      { name: "龙岩市", weight: 26, tier: "四线", urbanRate: 0.64, gdpLevel: "中等" },
      { name: "三明市", weight: 24, tier: "四线", urbanRate: 0.64, gdpLevel: "中等" },
      { name: "南平市", weight: 24, tier: "四线", urbanRate: 0.60, gdpLevel: "偏低" }
    ]
  },
  {
    province: "江西省",
    tier: "老区山水·老俵奋斗",
    gaokao: "极高难度",
    urbanRate: 0.61,
    gdpLevel: "中等",
    cities: [
      { name: "南昌市", weight: 60, tier: "二线", urbanRate: 0.78, gdpLevel: "高" },
      { name: "赣州市", weight: 95, tier: "三线", urbanRate: 0.56, gdpLevel: "偏低" },
      { name: "上饶市", weight: 65, tier: "三线", urbanRate: 0.55, gdpLevel: "偏低" },
      { name: "宜春市", weight: 52, tier: "三线", urbanRate: 0.56, gdpLevel: "偏低" },
      { name: "九江市", weight: 45, tier: "三线", urbanRate: 0.62, gdpLevel: "中等" },
      { name: "吉安市", weight: 45, tier: "四线", urbanRate: 0.54, gdpLevel: "偏低" },
      { name: "抚州市", weight: 38, tier: "四线", urbanRate: 0.57, gdpLevel: "偏低" },
      { name: "萍乡市", weight: 18, tier: "四线", urbanRate: 0.68, gdpLevel: "中等" },
      { name: "新余市", weight: 14, tier: "四线", urbanRate: 0.72, gdpLevel: "高" },
      { name: "景德镇市", weight: 16, tier: "四线", urbanRate: 0.67, gdpLevel: "中等" },
      { name: "鹰潭市", weight: 12, tier: "四线", urbanRate: 0.65, gdpLevel: "中等" }
    ]
  },
  {
    province: "陕西省",
    tier: "西北龙头·科教军工",
    gaokao: "竞争激烈",
    urbanRate: 0.63,
    gdpLevel: "中等",
    cities: [
      { name: "西安市", weight: 120, tier: "新一线", urbanRate: 0.79, gdpLevel: "高" },
      { name: "宝鸡市", weight: 30, tier: "四线", urbanRate: 0.58, gdpLevel: "中等" },
      { name: "咸阳市", weight: 40, tier: "三线", urbanRate: 0.57, gdpLevel: "中等" },
      { name: "渭南市", weight: 45, tier: "四线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "汉中市", weight: 32, tier: "四线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "榆林市", weight: 35, tier: "三线", urbanRate: 0.61, gdpLevel: "超高" },
      { name: "安康市", weight: 25, tier: "五线", urbanRate: 0.51, gdpLevel: "偏低" },
      { name: "延安市", weight: 22, tier: "四线", urbanRate: 0.64, gdpLevel: "高" },
      { name: "商洛市", weight: 20, tier: "五线", urbanRate: 0.50, gdpLevel: "偏低" },
      { name: "铜川市", weight: 8, tier: "五线", urbanRate: 0.67, gdpLevel: "偏低" }
    ]
  },
  {
    province: "辽宁省",
    tier: "共和国长子·重工业基地",
    gaokao: "中等难度",
    urbanRate: 0.73,
    gdpLevel: "中等",
    cities: [
      { name: "沈阳市", weight: 65, tier: "新一线", urbanRate: 0.84, gdpLevel: "高" },
      { name: "大连市", weight: 55, tier: "二线", urbanRate: 0.82, gdpLevel: "高" },
      { name: "鞍山市", weight: 26, tier: "三线", urbanRate: 0.74, gdpLevel: "中等" },
      { name: "锦州市", weight: 24, tier: "四线", urbanRate: 0.57, gdpLevel: "中等" },
      { name: "阜新市", weight: 14, tier: "五线", urbanRate: 0.60, gdpLevel: "偏低" },
      { name: "盘锦市", weight: 14, tier: "四线", urbanRate: 0.78, gdpLevel: "高" },
      { name: "营口市", weight: 18, tier: "四线", urbanRate: 0.66, gdpLevel: "中等" },
      { name: "朝阳市", weight: 24, tier: "四线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "抚顺市", weight: 16, tier: "四线", urbanRate: 0.72, gdpLevel: "偏低" },
      { name: "本溪市", weight: 12, tier: "四线", urbanRate: 0.80, gdpLevel: "中等" },
      { name: "丹东市", weight: 18, tier: "四线", urbanRate: 0.68, gdpLevel: "偏低" },
      { name: "辽阳市", weight: 14, tier: "四线", urbanRate: 0.68, gdpLevel: "中等" },
      { name: "铁岭市", weight: 22, tier: "四线", urbanRate: 0.54, gdpLevel: "偏低" },
      { name: "葫芦岛市", weight: 22, tier: "四线", urbanRate: 0.58, gdpLevel: "偏低" }
    ]
  },
  {
    province: "吉林省",
    tier: "黑土地·汽车与粮仓",
    gaokao: "中等难度",
    urbanRate: 0.63,
    gdpLevel: "中等",
    cities: [
      { name: "长春市", weight: 65, tier: "二线", urbanRate: 0.67, gdpLevel: "高" },
      { name: "吉林市", weight: 28, tier: "三线", urbanRate: 0.55, gdpLevel: "中等" },
      { name: "延边朝鲜族自治州", weight: 15, tier: "四线", urbanRate: 0.74, gdpLevel: "偏低" },
      { name: "四平市", weight: 16, tier: "四线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "通化市", weight: 12, tier: "四线", urbanRate: 0.57, gdpLevel: "偏低" },
      { name: "白城市", weight: 14, tier: "五线", urbanRate: 0.53, gdpLevel: "偏低" },
      { name: "松原市", weight: 18, tier: "四线", urbanRate: 0.49, gdpLevel: "中等" },
      { name: "辽源市", weight: 8, tier: "五线", urbanRate: 0.60, gdpLevel: "偏低" },
      { name: "白山市", weight: 8, tier: "五线", urbanRate: 0.77, gdpLevel: "偏低" }
    ]
  },
  {
    province: "黑龙江省",
    tier: "祖国北疆·大国粮仓与冰雪",
    gaokao: "中等偏易",
    urbanRate: 0.66,
    gdpLevel: "中等偏低",
    cities: [
      { name: "哈尔滨市", weight: 70, tier: "二线", urbanRate: 0.70, gdpLevel: "中等" },
      { name: "大庆市", weight: 22, tier: "三线", urbanRate: 0.74, gdpLevel: "高" },
      { name: "齐齐哈尔市", weight: 30, tier: "三线", urbanRate: 0.55, gdpLevel: "偏低" },
      { name: "牡丹江市", weight: 18, tier: "四线", urbanRate: 0.66, gdpLevel: "偏低" },
      { name: "佳木斯市", weight: 18, tier: "四线", urbanRate: 0.65, gdpLevel: "偏低" },
      { name: "绥化市", weight: 32, tier: "四线", urbanRate: 0.38, gdpLevel: "偏低" },
      { name: "鸡西市", weight: 12, tier: "五线", urbanRate: 0.67, gdpLevel: "偏低" },
      { name: "双鸭山市", weight: 10, tier: "五线", urbanRate: 0.64, gdpLevel: "偏低" },
      { name: "伊春市", weight: 8, tier: "五线", urbanRate: 0.81, gdpLevel: "偏低" },
      { name: "七台河市", weight: 6, tier: "五线", urbanRate: 0.73, gdpLevel: "偏低" },
      { name: "鹤岗市", weight: 6, tier: "五线", urbanRate: 0.82, gdpLevel: "偏低" },
      { name: "黑河市", weight: 10, tier: "五线", urbanRate: 0.58, gdpLevel: "偏低" },
      { name: "大兴安岭地区", weight: 3, tier: "五线", urbanRate: 0.82, gdpLevel: "偏低" }
    ]
  },
  {
    province: "广西壮族自治区",
    tier: "八桂大地·边海特色",
    gaokao: "极高难度",
    urbanRate: 0.54,
    gdpLevel: "偏低",
    cities: [
      { name: "南宁市", weight: 85, tier: "二线", urbanRate: 0.69, gdpLevel: "中等" },
      { name: "柳州市", weight: 42, tier: "三线", urbanRate: 0.69, gdpLevel: "中等" },
      { name: "桂林市", weight: 45, tier: "三线", urbanRate: 0.54, gdpLevel: "中等" },
      { name: "玉林市", weight: 68, tier: "三线", urbanRate: 0.50, gdpLevel: "偏低" },
      { name: "贵港市", weight: 48, tier: "四线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "百色市", weight: 40, tier: "四线", urbanRate: 0.42, gdpLevel: "偏低" },
      { name: "河池市", weight: 38, tier: "四线", urbanRate: 0.41, gdpLevel: "偏低" },
      { name: "钦州市", weight: 36, tier: "四线", urbanRate: 0.43, gdpLevel: "偏低" },
      { name: "梧州市", weight: 30, tier: "四线", urbanRate: 0.53, gdpLevel: "偏低" },
      { name: "北海市", weight: 18, tier: "四线", urbanRate: 0.59, gdpLevel: "高" },
      { name: "防城港市", weight: 12, tier: "五线", urbanRate: 0.60, gdpLevel: "高" },
      { name: "崇左市", weight: 22, tier: "五线", urbanRate: 0.41, gdpLevel: "偏低" },
      { name: "来宾市", weight: 24, tier: "五线", urbanRate: 0.45, gdpLevel: "偏低" },
      { name: "贺州市", weight: 22, tier: "五线", urbanRate: 0.48, gdpLevel: "偏低" }
    ]
  },
  {
    province: "云南省",
    tier: "彩云之南·多民族高原",
    gaokao: "极高难度",
    urbanRate: 0.50,
    gdpLevel: "偏低",
    cities: [
      { name: "昆明市", weight: 80, tier: "二线", urbanRate: 0.79, gdpLevel: "高" },
      { name: "曲靖市", weight: 62, tier: "三线", urbanRate: 0.51, gdpLevel: "中等" },
      { name: "昭通市", weight: 60, tier: "四线", urbanRate: 0.40, gdpLevel: "偏低" },
      { name: "红河哈尼族彝族自治州", weight: 45, tier: "四线", urbanRate: 0.49, gdpLevel: "中等" },
      { name: "玉溪市", weight: 22, tier: "四线", urbanRate: 0.54, gdpLevel: "高" },
      { name: "大理白族自治州", weight: 32, tier: "四线", urbanRate: 0.50, gdpLevel: "中等" },
      { name: "楚雄彝族自治州", weight: 22, tier: "四线", urbanRate: 0.46, gdpLevel: "中等" },
      { name: "文山壮族苗族自治州", weight: 35, tier: "五线", urbanRate: 0.42, gdpLevel: "偏低" },
      { name: "普洱市", weight: 22, tier: "五线", urbanRate: 0.43, gdpLevel: "偏低" },
      { name: "保山市", weight: 24, tier: "五线", urbanRate: 0.43, gdpLevel: "偏低" },
      { name: "临沧市", weight: 22, tier: "五线", urbanRate: 0.41, gdpLevel: "偏低" },
      { name: "西双版纳傣族自治州", weight: 12, tier: "四线", urbanRate: 0.55, gdpLevel: "中等" },
      { name: "德宏傣族景颇族自治州", weight: 12, tier: "五线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "丽江市", weight: 12, tier: "四线", urbanRate: 0.50, gdpLevel: "中等" },
      { name: "怒江傈僳族自治州", weight: 6, tier: "五线", urbanRate: 0.35, gdpLevel: "偏低" },
      { name: "迪庆藏族自治州", weight: 4, tier: "五线", urbanRate: 0.34, gdpLevel: "偏低" }
    ]
  },
  {
    province: "贵州省",
    tier: "西南腹地·大数据与大山",
    gaokao: "极高难度",
    urbanRate: 0.55,
    gdpLevel: "偏低",
    cities: [
      { name: "贵阳市", weight: 65, tier: "二线", urbanRate: 0.80, gdpLevel: "高" },
      { name: "遵义市", weight: 65, tier: "三线", urbanRate: 0.57, gdpLevel: "中等" },
      { name: "毕节市", weight: 75, tier: "三线", urbanRate: 0.43, gdpLevel: "偏低" },
      { name: "黔东南苗族侗族自治州", weight: 42, tier: "五线", urbanRate: 0.47, gdpLevel: "偏低" },
      { name: "黔南布依族苗族自治州", weight: 38, tier: "四线", urbanRate: 0.54, gdpLevel: "偏低" },
      { name: "六盘水市", weight: 32, tier: "四线", urbanRate: 0.55, gdpLevel: "中等" },
      { name: "铜仁市", weight: 32, tier: "五线", urbanRate: 0.46, gdpLevel: "偏低" },
      { name: "黔西南布依族苗族自治州", weight: 30, tier: "五线", urbanRate: 0.49, gdpLevel: "偏低" },
      { name: "安顺市", weight: 24, tier: "四线", urbanRate: 0.54, gdpLevel: "偏低" }
    ]
  },
  {
    province: "山西省",
    tier: "煤炭大省·晋善晋美",
    gaokao: "极高难度",
    urbanRate: 0.63,
    gdpLevel: "中等",
    cities: [
      { name: "太原市", weight: 48, tier: "二线", urbanRate: 0.88, gdpLevel: "高" },
      { name: "运城市", weight: 45, tier: "三线", urbanRate: 0.53, gdpLevel: "偏低" },
      { name: "临汾市", weight: 40, tier: "三线", urbanRate: 0.54, gdpLevel: "偏低" },
      { name: "大同市", weight: 30, tier: "三线", urbanRate: 0.65, gdpLevel: "中等" },
      { name: "晋中市", weight: 32, tier: "四线", urbanRate: 0.59, gdpLevel: "中等" },
      { name: "长治市", weight: 30, tier: "四线", urbanRate: 0.56, gdpLevel: "中等" },
      { name: "晋城市", weight: 22, tier: "四线", urbanRate: 0.62, gdpLevel: "高" },
      { name: "忻州市", weight: 26, tier: "四线", urbanRate: 0.53, gdpLevel: "偏低" },
      { name: "吕梁市", weight: 35, tier: "四线", urbanRate: 0.54, gdpLevel: "中等" },
      { name: "阳泉市", weight: 12, tier: "四线", urbanRate: 0.70, gdpLevel: "中等" },
      { name: "朔州市", weight: 16, tier: "四线", urbanRate: 0.58, gdpLevel: "高" }
    ]
  },
  {
    province: "内蒙古自治区",
    tier: "北疆屏障·草原与矿藏",
    gaokao: "中等难度",
    urbanRate: 0.68,
    gdpLevel: "高",
    cities: [
      { name: "呼和浩特市", weight: 32, tier: "二线", urbanRate: 0.80, gdpLevel: "高" },
      { name: "包头市", weight: 26, tier: "三线", urbanRate: 0.86, gdpLevel: "高" },
      { name: "鄂尔多斯市", weight: 22, tier: "三线", urbanRate: 0.77, gdpLevel: "超高" },
      { name: "赤峰市", weight: 38, tier: "三线", urbanRate: 0.54, gdpLevel: "偏低" },
      { name: "通辽市", weight: 28, tier: "四线", urbanRate: 0.50, gdpLevel: "中等" },
      { name: "呼伦贝尔市", weight: 18, tier: "四线", urbanRate: 0.74, gdpLevel: "中等" },
      { name: "巴彦淖尔市", weight: 15, tier: "四线", urbanRate: 0.58, gdpLevel: "中等" },
      { name: "乌兰察布市", weight: 16, tier: "四线", urbanRate: 0.57, gdpLevel: "偏低" },
      { name: "乌海市", weight: 6, tier: "四线", urbanRate: 0.95, gdpLevel: "超高" },
      { name: "兴安盟", weight: 14, tier: "五线", urbanRate: 0.52, gdpLevel: "偏低" },
      { name: "锡林郭勒盟", weight: 10, tier: "五线", urbanRate: 0.74, gdpLevel: "高" },
      { name: "阿拉善盟", weight: 3, tier: "五线", urbanRate: 0.81, gdpLevel: "高" }
    ]
  },
  {
    province: "新疆维吾尔自治区",
    tier: "大美新疆·丝路核心",
    gaokao: "相对温和",
    urbanRate: 0.57,
    gdpLevel: "中等",
    cities: [
      { name: "乌鲁木齐市", weight: 40, tier: "二线", urbanRate: 0.96, gdpLevel: "高" },
      { name: "喀什地区", weight: 48, tier: "四线", urbanRate: 0.32, gdpLevel: "偏低" },
      { name: "伊犁哈萨克自治州", weight: 30, tier: "四线", urbanRate: 0.51, gdpLevel: "中等" },
      { name: "巴音郭楞蒙古自治州", weight: 16, tier: "四线", urbanRate: 0.65, gdpLevel: "高" },
      { name: "阿克苏地区", weight: 28, tier: "四线", urbanRate: 0.44, gdpLevel: "中等" },
      { name: "昌吉回族自治州", weight: 16, tier: "四线", urbanRate: 0.60, gdpLevel: "高" },
      { name: "和田地区", weight: 25, tier: "五线", urbanRate: 0.28, gdpLevel: "偏低" },
      { name: "克拉玛依市", weight: 5, tier: "三线", urbanRate: 0.99, gdpLevel: "超高" },
      { name: "阿勒泰地区", weight: 7, tier: "五线", urbanRate: 0.54, gdpLevel: "偏低" },
      { name: "塔城地区", weight: 11, tier: "五线", urbanRate: 0.55, gdpLevel: "中等" },
      { name: "哈密市", weight: 6, tier: "四线", urbanRate: 0.63, gdpLevel: "高" },
      { name: "吐鲁番市", weight: 6, tier: "四线", urbanRate: 0.49, gdpLevel: "中等" },
      { name: "博尔塔拉蒙古自治州", weight: 5, tier: "五线", urbanRate: 0.65, gdpLevel: "中等" },
      { name: "克孜勒苏柯尔克孜自治州", weight: 7, tier: "五线", urbanRate: 0.39, gdpLevel: "偏低" },
      { name: "兵团及省直辖县级市", weight: 25, tier: "四线", urbanRate: 0.70, gdpLevel: "中等" }
    ]
  },
  {
    province: "甘肃省",
    tier: "丝路咽喉·黄河之滨",
    gaokao: "竞争激烈",
    urbanRate: 0.53,
    gdpLevel: "偏低",
    cities: [
      { name: "兰州市", weight: 42, tier: "二线", urbanRate: 0.83, gdpLevel: "中等" },
      { name: "天水市", weight: 30, tier: "四线", urbanRate: 0.45, gdpLevel: "偏低" },
      { name: "定西市", weight: 26, tier: "五线", urbanRate: 0.41, gdpLevel: "偏低" },
      { name: "平凉市", weight: 20, tier: "五线", urbanRate: 0.45, gdpLevel: "偏低" },
      { name: "庆阳市", weight: 22, tier: "五线", urbanRate: 0.45, gdpLevel: "偏低" },
      { name: "陇南市", weight: 24, tier: "五线", urbanRate: 0.38, gdpLevel: "偏低" },
      { name: "武威市", weight: 17, tier: "四线", urbanRate: 0.48, gdpLevel: "偏低" },
      { name: "张掖市", weight: 12, tier: "四线", urbanRate: 0.51, gdpLevel: "偏低" },
      { name: "酒泉市", weight: 11, tier: "四线", urbanRate: 0.64, gdpLevel: "中等" },
      { name: "白银市", weight: 16, tier: "四线", urbanRate: 0.54, gdpLevel: "偏低" },
      { name: "临夏回族自治州", weight: 22, tier: "五线", urbanRate: 0.37, gdpLevel: "偏低" },
      { name: "甘南藏族自治州", weight: 7, tier: "五线", urbanRate: 0.42, gdpLevel: "偏低" },
      { name: "金昌市", weight: 5, tier: "四线", urbanRate: 0.74, gdpLevel: "高" },
      { name: "嘉峪关市", weight: 4, tier: "四线", urbanRate: 0.94, gdpLevel: "高" }
    ]
  },
  {
    province: "海南省",
    tier: "自贸海岛·椰林热带",
    gaokao: "相对温和",
    urbanRate: 0.61,
    gdpLevel: "中等",
    cities: [
      { name: "海口市", weight: 30, tier: "二线", urbanRate: 0.81, gdpLevel: "高" },
      { name: "三亚市", weight: 12, tier: "三线", urbanRate: 0.71, gdpLevel: "高" },
      { name: "儋州市", weight: 12, tier: "四线", urbanRate: 0.55, gdpLevel: "中等" },
      { name: "省直辖县市(文昌/琼海/万宁/东方等)", weight: 40, tier: "四线", urbanRate: 0.50, gdpLevel: "中等" }
    ]
  },
  {
    province: "宁夏回族自治区",
    tier: "塞上江南·枸杞与能源",
    gaokao: "相对温和",
    urbanRate: 0.65,
    gdpLevel: "中等",
    cities: [
      { name: "银川市", weight: 28, tier: "三线", urbanRate: 0.81, gdpLevel: "高" },
      { name: "吴忠市", weight: 15, tier: "四线", urbanRate: 0.55, gdpLevel: "中等" },
      { name: "固原市", weight: 14, tier: "五线", urbanRate: 0.44, gdpLevel: "偏低" },
      { name: "中卫市", weight: 12, tier: "四线", urbanRate: 0.54, gdpLevel: "中等" },
      { name: "石嘴山市", weight: 8, tier: "四线", urbanRate: 0.79, gdpLevel: "高" }
    ]
  },
  {
    province: "青海省",
    tier: "中华水塔·青藏高原",
    gaokao: "相对温和",
    urbanRate: 0.60,
    gdpLevel: "中等偏低",
    cities: [
      { name: "西宁市", weight: 24, tier: "三线", urbanRate: 0.78, gdpLevel: "中等" },
      { name: "海东市", weight: 14, tier: "五线", urbanRate: 0.41, gdpLevel: "偏低" },
      { name: "海西蒙古族藏族自治州", weight: 5, tier: "四线", urbanRate: 0.77, gdpLevel: "超高" },
      { name: "海南/海北/黄南/果洛/玉树自治州", weight: 18, tier: "五线", urbanRate: 0.35, gdpLevel: "偏低" }
    ]
  },
  {
    province: "西藏自治区",
    tier: "雪域高原·日光之城",
    gaokao: "优待相对最高",
    urbanRate: 0.36,
    gdpLevel: "偏低",
    cities: [
      { name: "拉萨市", weight: 10, tier: "四线", urbanRate: 0.58, gdpLevel: "中等" },
      { name: "日喀则市", weight: 8, tier: "五线", urbanRate: 0.28, gdpLevel: "偏低" },
      { name: "昌都市", weight: 8, tier: "五线", urbanRate: 0.26, gdpLevel: "偏低" },
      { name: "山南市", weight: 4, tier: "五线", urbanRate: 0.34, gdpLevel: "偏低" },
      { name: "林芝市", weight: 3, tier: "五线", urbanRate: 0.44, gdpLevel: "中等" },
      { name: "那曲市/阿里地区", weight: 5, tier: "五线", urbanRate: 0.25, gdpLevel: "偏低" }
    ]
  },
  {
    province: "香港与澳门",
    tier: "特别行政区",
    gaokao: "特区教育制度",
    urbanRate: 1.0,
    gdpLevel: "超高",
    cities: [
      { name: "香港特别行政区", weight: 5, tier: "特区核心", urbanRate: 1.0, gdpLevel: "超高" },
      { name: "澳门特别行政区", weight: 1, tier: "特区核心", urbanRate: 1.0, gdpLevel: "超高" }
    ]
  }
];

// Flatten and normalize into comprehensive city list
let allCities = [];
let idCounter = 1000;

for (const prov of rawProvinces) {
  for (const c of prov.cities) {
    idCounter++;
    allCities.push({
      id: `city_${idCounter}`,
      name: c.name,
      province: prov.province,
      tier: c.tier || prov.tier,
      weight: c.weight, // Relative birth weight in national births
      urbanRate: c.urbanRate !== undefined ? c.urbanRate : prov.urbanRate,
      gdpLevel: c.gdpLevel || prov.gdpLevel,
      gaokaoDifficulty: prov.gaokao
    });
  }
}

const totalWeight = allCities.reduce((acc, c) => acc + c.weight, 0);

const fileContent = `/**
 * 全国 34 个省级行政区地级行政单元基础出生权重与社会经济特征数据库
 * 总单元数: ${allCities.length}
 * 总权重分: ${totalWeight}
 */

export const CITIES_DATA = ${JSON.stringify(allCities, null, 2)};

/**
 * 根据全国年出生人口加权随机抽选出生地与城乡户籍
 */
export function rollBirthCity() {
  const total = ${totalWeight};
  let random = Math.random() * total;
  
  for (const city of CITIES_DATA) {
    if (random < city.weight) {
      // 决定城镇户口还是农村户口
      const isRural = Math.random() > city.urbanRate;
      return {
        city,
        isRural,
        householdType: isRural ? "农村户口" : "城镇户口"
      };
    }
    random -= city.weight;
  }
  
  // 兜底返回第一项
  return {
    city: CITIES_DATA[0],
    isRural: false,
    householdType: "城镇户口"
  };
}
`;

fs.mkdirSync('./src/data', { recursive: true });
fs.writeFileSync('./src/data/cities.js', fileContent, 'utf-8');
console.log(`Generated cities.js with ${allCities.length} prefecture divisions. Total weight: ${totalWeight}`);
