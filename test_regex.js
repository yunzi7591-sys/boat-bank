const text1 = "10R以降発売中 10R 投票 にっぽん未来プロジェクト競走ｉｎ桐生 2/24-3/1最終日 出走表 オッズ 直前情報";
const text2 = "最終Ｒ発売終了 第２４回日本モーターボート選手会会長賞 2/28-3/3２日目 出走表 オッズ 直前情報";
function extractDay(text) {
    const match = text.match(/(初日|[１-９1-9]{1,2}日目|最終日)/);
    return match ? match[1] : "-日目";
}
console.log(extractDay(text1));
console.log(extractDay(text2));
