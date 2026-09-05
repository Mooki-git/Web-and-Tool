/* =========================================================
   한국 음력-양력 변환 데이터 (KASI 표준 기준)
   출처: korean-lunar-calendar (Jinil Lee, MIT License)
   https://github.com/usingsky/korean_lunar_calendar_js
   지원 범위: 음력 1000-01-01 ~ 2050-11-18 / 양력 1000-02-13 ~ 2050-12-31
   ========================================================= */
var LUNAR_CALENDAR_DATA = {
  KOREAN_LUNAR_MIN_VALUE: 10000101,
  KOREAN_LUNAR_MAX_VALUE: 20501118,
  KOREAN_SOLAR_MIN_VALUE: 10000213,
  KOREAN_SOLAR_MAX_VALUE: 20501231,

  KOREAN_LUNAR_BASE_YEAR: 1000,
  SOLAR_LUNAR_DAY_DIFF: 43,

  LUNAR_SMALL_MONTH_DAY: 29,
  LUNAR_BIG_MONTH_DAY: 30,
  SOLAR_SMALL_YEAR_DAY: 365,
  SOLAR_BIG_YEAR_DAY: 366,

  SOLAR_DAYS: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 29],

  KOREAN_LUNAR_DATA: [
    0x82c60a57, 0x82fec52b, 0x82c40d2a, 0x82c60d55, 0xc30095ad, 0x82c4056a,
    0x82c6096d, 0x830054dd, 0xc2c404ad, 0x82c40a4d, 0x83002e4d, 0x82c40b26,
    0xc300ab56, 0x82c60ad5, 0x82c4035a, 0x8300697a, 0xc2c6095b, 0x82c4049b,
    0x83004a9b, 0x82c40a4b, 0xc301caa5, 0x82c406aa, 0x82c60ad5, 0x830092dd,
    0xc2c402b5, 0x82c60957, 0x82fe54ae, 0x82c60c97, 0xc2c4064b, 0x82ff254a,
    0x82c60da9, 0x8300a6b6, 0xc2c6066d, 0x82c4026e, 0x8301692e, 0x82c4092e,
    0xc2c40c96, 0x83004d95, 0x82c40d4a, 0x8300cd69, 0xc2c40b58, 0x82c80d6b,
    0x8301926b, 0x82c4025d, 0xc2c4092b, 0x83005aab, 0x82c40a95, 0x82c40b4a,
    0xc3021eab, 0x82c402d5, 0x8301b55a, 0x82c604bb, 0xc2c4025b, 0x83007537,
    0x82c4052b, 0x82c40695, 0xc3003755, 0x82c406aa, 0x8303cab5, 0x82c40275,
    0xc2c404b6, 0x83008a5e, 0x82c40a56, 0x82c40d26, 0xc3005ea6, 0x82c60d55,
    0x82c405aa, 0x83001d6a, 0xc2c6096d, 0x8300b4af, 0x82c4049d, 0x82c40a4d,
    0xc3007d2d, 0x82c40aa6, 0x82c60b55, 0x830045d5, 0xc2c4035a, 0x82c6095d,
    0x83011173, 0x82c4045b, 0xc3009a4f, 0x82c4064b, 0x82c40aa5, 0x83006b69,
    0xc2c606b5, 0x82c402da, 0x83002ab6, 0x82c60937, 0xc2fec497, 0x82c60c97,
    0x82c4064b, 0x82fe86aa, 0xc2c60da5, 0x82c405b4, 0x83034a6d, 0x82c402ae,
    0xc2c40e61, 0x83002d2e, 0x82c40c96, 0x83009d4d, 0x82c40d4a, 0x82c60d65,
    0x83016595, 0x82c6055d, 0xc2c4026d, 0x83002a5d, 0x82c4092b, 0x8300aa97,
    0xc2c40a95, 0x82c40b4a, 0x83008b5a, 0x82c60ad5, 0xc2c6055b, 0x830042b7,
    0x82c40457, 0x82c4052b, 0xc3001d2b, 0x82c40695, 0x8300972d, 0x82c405aa,
    0xc2c60ab5, 0x830054ed, 0x82c404b6, 0x82c60a57, 0xc2ff344e, 0x82c40d26,
    0x8301be92, 0x82c60d55, 0xc2c405aa, 0x830089ba, 0x82c6096d, 0x82c404ae,
    0xc3004a9d, 0x82c40a4d, 0x82c40d25, 0x83002f25, 0xc2c40b54, 0x8303ad69,
    0x82c402da, 0x82c6095d, 0xc301649b, 0x82c4049b, 0x82c40a4b, 0x83004b4b,
    0xc2c406a5, 0x8300bb53, 0x82c406b4, 0x82c60ab6, 0xc3018956, 0x82c60997,
    0x82c40497, 0x83004697, 0xc2c4054b, 0x82fec6a5, 0x82c60da5, 0x82c405ac,
    0xc303aab5, 0x82c4026e, 0x82c4092e, 0x83006cae, 0xc2c40c96, 0x82c40d4a,
    0x83002f4a, 0x82c60d55, 0xc300b56b, 0x82c6055b, 0x82c4025d, 0x8300793d,
    0xc2c40927, 0x82c40a95, 0x83015d15, 0x82c40b4a, 0xc2c60b55, 0x830112d5,
    0x82c604db, 0x82fe925e, 0xc2c60a57, 0x82c4052b, 0x83006aab, 0x82c40695,
    0xc2c406aa, 0x83003baa, 0x82c60ab5, 0x8300b4b7, 0xc2c404ae, 0x82c60a57,
    0x82fe752e, 0x82c40d26, 0xc2c60e93, 0x830056d5, 0x82c405aa, 0x82c609b5,
    0xc300256d, 0x82c404ae, 0x8301aa4d, 0x82c40a4d, 0xc2c40d26, 0x83006d65,
    0x82c40b52, 0x82c60d6a, 0xc30026da, 0x82c6095d, 0x8301c49d, 0x82c4049b,
    0xc2c40a4b, 0x83008aab, 0x82c406a5, 0x82c40b54, 0xc3004bb4, 0x82c60ab6,
    0x82c6095b, 0x83002537, 0xc2c40497, 0x8300964f, 0x82c4054b, 0x82c406a5,
    0xc30176c5, 0x82c405ac, 0x82c60ab6, 0x8301386e, 0xc2c4092e, 0x8300cc97,
    0x82c40c96, 0x82c40d4a, 0xc3008daa, 0x82c60b55, 0x82c4056a, 0x83025adb,
    0xc2c4025d, 0x82c4092e, 0x83002d2b, 0x82c40a95, 0xc3009d4d, 0x82c40b2a,
    0x82c60b55, 0x83007575, 0xc2c404da, 0x82c60a5b, 0x83004557, 0x82c4052b,
    0xc301ca93, 0x82c40693, 0x82c406aa, 0x83008ada, 0xc2c60ae5, 0x82c404b6,
    0x83004aae, 0x82c60a57, 0xc2c40527, 0x82ff2526, 0x82c60e53, 0x8300a6cb,
    0xc2c405aa, 0x82c605ad, 0x830164ad, 0x82c404ae, 0xc2c40a4e, 0x83004d4d,
    0x82c40d26, 0x8300bd53, 0xc2c40b52, 0x82c60b6a, 0x8301956a, 0x82c60557,
    0xc2c4049d, 0x83015a1b, 0x82c40a4b, 0x82c40aa5, 0xc3001ea5, 0x82c40b52,
    0x8300bb5a, 0x82c60ab6, 0xc2c6095b, 0x830064b7, 0x82c40497, 0x82c4064b,
    0xc300374b, 0x82c406a5, 0x8300b6b3, 0x82c405ac, 0xc2c60ab6, 0x830182ad,
    0x82c4049e, 0x82c40a4d, 0xc3005d4b, 0x82c40b25, 0x82c40b52, 0x83012e52,
    0xc2c60b5a, 0x8300a95e, 0x82c6095b, 0x82c4049b, 0xc3006a57, 0x82c40a4b,
    0x82c40aa5, 0x83004ba5, 0xc2c406d4, 0x8300cad6, 0x82c60ab6, 0x82c60937,
    0x8300849f, 0x82c40497, 0x82c4064b, 0x82fe56ca, 0xc2c60da5, 0x82c405aa,
    0x83001d6c, 0x82c60a6e, 0xc300b92f, 0x82c4092e, 0x82c40c96, 0x83007d55,
    0xc2c40d4a, 0x82c60d55, 0x83013555, 0x82c4056a, 0xc2c60a6d, 0x83001a5d,
    0x82c4092b, 0x83008a5b, 0xc2c40a95, 0x82c40b2a, 0x83015b2a, 0x82c60ad5,
    0xc2c404da, 0x83001cba, 0x82c60a57, 0x8300952f, 0xc2c40527, 0x82c40693,
    0x830076b3, 0x82c406aa, 0xc2c60ab5, 0x83003575, 0x82c404b6, 0x8300ca67,
    0xc2c40a2e, 0x82c40d16, 0x83008e96, 0x82c40d4a, 0xc2c60daa, 0x830055ea,
    0x82c6056d, 0x82c404ae, 0xc301285d, 0x82c40a2d, 0x8300ad17, 0x82c40aa5,
    0xc2c40b52, 0x83007d74, 0x82c60ada, 0x82c6055d, 0xc300353b, 0x82c4045b,
    0x82c40a2b, 0x83011a2b, 0xc2c40aa5, 0x83009b55, 0x82c406b2, 0x82c60ad6,
    0xc3015536, 0x82c60937, 0x82c40457, 0x83003a57, 0xc2c4052b, 0x82feaaa6,
    0x82c60d95, 0x82c405aa, 0xc3017aac, 0x82c60a6e, 0x82c4052e, 0x83003cae,
    0xc2c40a56, 0x8300bd2b, 0x82c40d2a, 0x82c60d55, 0xc30095ad, 0x82c4056a,
    0x82c60a6d, 0x8300555d, 0xc2c4052b, 0x82c40a8d, 0x83002e55, 0x82c40b2a,
    0xc300ab56, 0x82c60ad5, 0x82c404da, 0x83006a7a, 0xc2c60a57, 0x82c4051b,
    0x83014a17, 0x82c40653, 0xc301c6a9, 0x82c405aa, 0x82c60ab5, 0x830092bd,
    0xc2c402b6, 0x82c60a37, 0x82fe552e, 0x82c40d16, 0x82c60e4b, 0x82fe3752,
    0x82c60daa, 0x8301b5b4, 0xc2c6056d, 0x82c402ae, 0x83007a3d, 0x82c40a2d,
    0xc2c40d15, 0x83004d95, 0x82c40b52, 0x8300cb69, 0xc2c60ada, 0x82c6055d,
    0x8301925b, 0x82c4045b, 0xc2c40a2b, 0x83005aab, 0x82c40a95, 0x82c40b52,
    0xc3001eaa, 0x82c60ab6, 0x8300c55b, 0x82c604b7, 0xc2c40457, 0x83007537,
    0x82c4052b, 0x82c40695, 0xc3014695, 0x82c405aa, 0x8300cab5, 0x82c60a6e,
    0xc2c404ae, 0x83008a5e, 0x82c40a56, 0x82c40d2a, 0xc3006eaa, 0x82c60d55,
    0x82c4056a, 0x8301295a, 0xc2c6095d, 0x8300b4af, 0x82c4049b, 0x82c40a4d,
    0xc3007d2d, 0x82c40b2a, 0x82c60b55, 0x830045d5, 0xc2c402da, 0x82c6095b,
    0x83011157, 0x82c4049b, 0xc3009a4f, 0x82c4064b, 0x82c406a9, 0x83006aea,
    0xc2c606b5, 0x82c402b6, 0x83002aae, 0x82c60937, 0xc2ffb496, 0x82c40c96,
    0x82c60e4b, 0x82fe76b2, 0xc2c60daa, 0x82c605ad, 0x8300336d, 0x82c4026e,
    0xc2c4092e, 0x83002d2d, 0x82c40c95, 0x83009d4d, 0xc2c40b4a, 0x82c60b69,
    0x8301655a, 0x82c6055b, 0xc2c4025d, 0x83002a5b, 0x82c4092b, 0x8300aa97,
    0xc2c40695, 0x82c4074a, 0x83008b5a, 0x82c60ab6, 0xc2c6053b, 0x830042b7,
    0x82c40257, 0x82c4052b, 0xc3001d2b, 0x82c40695, 0x830096ad, 0x82c405aa,
    0xc2c60ab5, 0x830054ed, 0x82c404ae, 0x82c60a57, 0xc2ff344e, 0x82c40d2a,
    0x8301bd94, 0x82c60b55, 0x82c4056a, 0x8300797a, 0x82c6095d, 0x82c404ae,
    0xc3004a9b, 0x82c40a4d, 0x82c40d25, 0x83011aaa, 0xc2c60b55, 0x8300956d,
    0x82c402da, 0x82c6095b, 0xc30054b7, 0x82c40497, 0x82c40a4b, 0x83004b4b,
    0xc2c406a9, 0x8300cad5, 0x82c605b5, 0x82c402b6, 0xc300895e, 0x82c6092f,
    0x82c40497, 0x82fe4696, 0xc2c40d4a, 0x8300cea5, 0x82c60d69, 0x82c6056d,
    0xc301a2b5, 0x82c4026e, 0x82c4092e, 0x83006cad, 0xc2c40c95, 0x82c40d4a,
    0x83002f4a, 0x82c60b59, 0xc300c56d, 0x82c6055b, 0x82c4025d, 0x8300793b,
    0xc2c4092b, 0x82c40a95, 0x83015b15, 0x82c406ca, 0xc2c60ad5, 0x830112b6,
    0x82c604bb, 0x8300925f, 0xc2c40257, 0x82c4052b, 0x82fe6aaa, 0x82c60e95,
    0xc2c406aa, 0x83003baa, 0x82c60ab5, 0x8300b4b7, 0xc2c404ae, 0x82c60a57,
    0x82fe752d, 0x82c40d26, 0xc2c60d95, 0x830055d5, 0x82c4056a, 0x82c6096d,
    0xc300255d, 0x82c404ae, 0x8300aa4f, 0x82c40a4d, 0xc2c40d25, 0x83006d69,
    0x82c60b55, 0x82c4035a, 0xc3002aba, 0x82c6095b, 0x8301c49b, 0x82c40497,
    0xc2c40a4b, 0x83008b2b, 0x82c406a5, 0x82c406d4, 0xc3034ab5, 0x82c402b6,
    0x82c60937, 0x8300252f, 0xc2c40497, 0x82fe964e, 0x82c40d4a, 0x82c60ea5,
    0xc30166a9, 0x82c6056d, 0x82c402b6, 0x8301385e, 0xc2c4092e, 0x8300bc97,
    0x82c40a95, 0x82c40d4a, 0xc3008daa, 0x82c60b4d, 0x82c6056b, 0x830042db,
    0xc2c4025d, 0x82c4092d, 0x83002d2b, 0x82c40a95, 0xc3009b4d, 0x82c406aa,
    0x82c60ad5, 0x83006575, 0xc2c604bb, 0x82c4025b, 0x83013457, 0x82c4052b,
    0xc2ffba94, 0x82c60e95, 0x82c406aa, 0x83008ada, 0xc2c609b5, 0x82c404b6,
    0x83004aae, 0x82c60a4f, 0xc2c20526, 0x83012d26, 0x82c60d55, 0x8301a5a9,
    0xc2c4056a, 0x82c6096d, 0x8301649d, 0x82c4049e, 0xc2c40a4d, 0x83004d4d,
    0x82c40d25, 0x8300bd53, 0xc2c40b54, 0x82c60b5a, 0x8301895a, 0x82c6095b,
    0xc2c4049b, 0x83004a97, 0x82c40a4b, 0x82c40aa5, 0xc3001ea5, 0x82c406d4,
    0x8302badb, 0x82c402b6, 0xc2c60937, 0x830064af, 0x82c40497, 0x82c4064b,
    0xc2fe374a, 0x82c60da5, 0x8300b6b5, 0x82c6056d, 0xc2c402ae, 0x8300793e,
    0x82c4092e, 0x82c40c96, 0xc3015d15, 0x82c40d4a, 0x82c60da5, 0x83013555,
    0xc2c4056a, 0x83007a7a, 0x82c60a5d, 0x82c4092d, 0xc3006aab, 0x82c40a95,
    0x82c40b4a, 0x83004baa, 0xc2c60ad5, 0x82c4055a, 0x830128ba, 0x82c60a5b,
    0xc3007537, 0x82c4052b, 0x82c40693, 0x83015715, 0xc2c406aa, 0x82c60ad5,
    0x830035b5, 0x82c404b6, 0xc3008a5e, 0x82c40a4e, 0x82c40d26, 0x83006ea6,
    0xc2c40d52, 0x82c60daa, 0x8301466a, 0x82c6056d, 0xc2c404ae, 0x83003a9d,
    0x82c40a4d, 0x83007d2b, 0xc2c40b25, 0x82c40d52, 0x83015d54, 0x82c60b5a,
    0xc2c6055d, 0x8300355b, 0x82c4049b, 0x83007657, 0x82c40a4b, 0x82c40aa5,
    0x83006b65, 0x82c406d2, 0xc2c60ada, 0x830045b6, 0x82c60937, 0x82c40497,
    0xc3003697, 0x82c4064d, 0x82fe76aa, 0x82c60da5, 0xc2c405aa, 0x83005aec,
    0x82c60aae, 0x82c4092e, 0xc3003d2e, 0x82c40c96, 0x83018d45, 0x82c40d4a,
    0xc2c60d55, 0x83016595, 0x82c4056a, 0x82c60a6d, 0xc300455d, 0x82c4052d,
    0x82c40a95, 0x83013c95, 0xc2c40b4a, 0x83017b4a, 0x82c60ad5, 0x82c4055a,
    0xc3015a3a, 0x82c60a5b, 0x82c4052b, 0x83014a17, 0xc2c40693, 0x830096ab,
    0x82c406aa, 0x82c60ab5, 0xc30064f5, 0x82c404b6, 0x82c60a57, 0x82fe452e,
    0xc2c40d16, 0x82c60e93, 0x82fe3752, 0x82c60daa, 0xc30175aa, 0x82c6056d,
    0x82c404ae, 0x83015a1d, 0xc2c40a2d, 0x82c40d15, 0x83004da5, 0x82c40b52,
    0xc3009d6a, 0x82c60ada, 0x82c6055d, 0x8301629b, 0xc2c4045b, 0x82c40a2b,
    0x83005b2b, 0x82c40a95, 0xc2c40b52, 0x83012ab2, 0x82c60ad6, 0x83017556,
    0xc2c60537, 0x82c40457, 0x83005657, 0x82c4052b, 0xc2c40695, 0x83003795,
    0x82c405aa, 0x8300aab6, 0xc2c60a6d, 0x82c404ae, 0x83006a6e, 0x82c40a56,
    0xc2c40d2a, 0x83005eaa, 0x82c60d55, 0x82c405aa, 0xc3003b6a, 0x82c60a6d,
    0x830074bd, 0x82c404ab, 0xc2c40a8d, 0x83005d55, 0x82c40b2a, 0x82c60b55,
    0xc30045d5, 0x82c404da, 0x82c6095d, 0x83002557, 0xc2c4049b, 0x83006a97,
    0x82c4064b, 0x82c406a9, 0x83004baa, 0x82c606b5, 0x82c402ba, 0x83002ab6,
    0xc2c60937, 0x82fe652e, 0x82c40d16, 0x82c60e4b, 0xc2fe56d2, 0x82c60da9,
    0x82c605b5, 0x8300336d, 0xc2c402ae, 0x82c40a2e, 0x83002e2d, 0x82c40c95,
    0xc3006d55, 0x82c40b52, 0x82c60b69, 0x830045da, 0xc2c6055d, 0x82c4025d,
    0x83003a5b, 0x82c40a2b, 0xc3017a8b, 0x82c40a95, 0x82c40b4a, 0x83015b2a,
    0xc2c60ad5, 0x82c6055b, 0x830042b7, 0x82c40257, 0xc300952f, 0x82c4052b,
    0x82c40695, 0x830066d5, 0xc2c405aa, 0x82c60ab5, 0x8300456d, 0x82c404ae,
    0xc2c60a57, 0x82ff3456, 0x82c40d2a, 0x83017e8a, 0xc2c60d55, 0x82c405aa,
    0x83005ada, 0x82c6095d, 0xc2c404ae, 0x83004aab, 0x82c40a4d, 0x83008d2b,
    0xc2c40b29, 0x82c60b55, 0x83007575, 0x82c402da, 0xc2c6095d, 0x830054d7,
    0x82c4049b, 0x82c40a4b, 0xc3013a4b, 0x82c406a9, 0x83008ad9, 0x82c606b5,
    0xc2c402b6, 0x83015936, 0x82c60937, 0x82c40497, 0xc2fe4696, 0x82c40e4a,
    0x8300aea6, 0x82c60da9, 0xc2c605ad, 0x830162ad, 0x82c402ae, 0x82c4092e,
    0xc3005cad, 0x82c40c95, 0x82c40d4a, 0x83013d4a, 0xc2c60b69, 0x8300757a,
    0x82c6055b, 0x82c4025d, 0xc300595b, 0x82c4092b, 0x82c40a95, 0x83004d95,
    0xc2c40b4a, 0x82c60b55, 0x830026d5, 0x82c6055b, 0xc3006277, 0x82c40257,
    0x82c4052b, 0x82fe5aaa, 0xc2c60e95, 0x82c406aa, 0x83003baa, 0x82c60ab5,
    0x830084bd, 0x82c404ae, 0x82c60a57, 0x82fe554d, 0xc2c40d26, 0x82c60d95,
    0x83014655, 0x82c4056a, 0xc2c609ad, 0x8300255d, 0x82c404ae, 0x83006a5b,
    0xc2c40a4d, 0x82c40d25, 0x83005da9, 0x82c60b55, 0xc2c4056a, 0x83002ada,
    0x82c6095d, 0x830074bb, 0xc2c4049b, 0x82c40a4b, 0x83005b4b, 0x82c406a9,
    0xc2c40ad4, 0x83024bb5, 0x82c402b6, 0x82c6095b, 0xc3002537, 0x82c40497,
    0x82fe6656, 0x82c40e4a, 0xc2c60ea5, 0x830156a9, 0x82c605b5, 0x82c402b6,
    0xc30138ae, 0x82c4092e, 0x83017c8d, 0x82c40c95, 0xc2c40d4a, 0x83016d8a,
    0x82c60b69, 0x82c6056d, 0xc301425b, 0x82c4025d, 0x82c4092d, 0x83002d2b,
    0xc2c40a95, 0x83007d55, 0x82c40b4a, 0x82c60b55, 0xc3015555, 0x82c604db,
    0x82c4025b, 0x83013857, 0xc2c4052b, 0x83008a9b, 0x82c40695, 0x82c406aa,
    0xc3006aea, 0x82c60ab5, 0x82c404b6, 0x83004aae, 0xc2c60a57, 0x82c40527,
    0x82fe3726, 0x82c60d95, 0xc30076b5, 0x82c4056a, 0x82c609ad, 0x830054dd,
    0xc2c404ae, 0x82c40a4e, 0x83004d4d, 0x82c40d25, 0xc3008d59, 0x82c40b54,
    0x82c60d6a, 0x8301695a, 0xc2c6095b, 0x82c4049b, 0x83004a9b, 0x82c40a4b,
    0xc300ab27, 0x82c406a5, 0x82c406d4, 0x83026b75, 0xc2c402b6, 0x82c6095b,
    0x830054b7, 0x82c40497, 0xc2c4064b, 0x82fe374a, 0x82c60ea5, 0x830086d9,
    0xc2c605ad, 0x82c402b6, 0x8300596e, 0x82c4092e, 0xc2c40c96, 0x83004e95,
    0x82c40d4a, 0x82c60da5, 0xc3002755, 0x82c4056c, 0x83027abb, 0x82c4025d,
    0xc2c4092d, 0x83005cab, 0x82c40a95, 0x82c40b4a, 0xc3013b4a, 0x82c60b55,
    0x8300955d, 0x82c404ba, 0xc2c60a5b, 0x83005557, 0x82c4052b, 0x82c40a95,
    0xc3004b95, 0x82c406aa, 0x82c60ad5, 0x830026b5, 0xc2c404b6, 0x83006a6e,
    0x82c60a57, 0x82c40527, 0xc2fe56a6, 0x82c60d93, 0x82c405aa, 0x83003b6a,
    0xc2c6096d, 0x8300b4af, 0x82c404ae, 0x82c40a4d, 0xc3016d0d, 0x82c40d25,
    0x82c40d52, 0x83005dd4, 0xc2c60b6a, 0x82c6096d, 0x8300255b, 0x82c4049b,
    0xc3007a57, 0x82c40a4b, 0x82c40b25, 0x83015b25, 0xc2c406d4, 0x82c60ada,
    0x830138b6
  ]
};

var D = LUNAR_CALENDAR_DATA;
var lunarYearDaysCache = {};
var solarYearDaysCache = {};

function getLunarData(year) { return D.KOREAN_LUNAR_DATA[year - D.KOREAN_LUNAR_BASE_YEAR]; }
function getLunarIntercalationMonth(lunarData) { return (lunarData >> 12) & 0x000f; }
function getLunarYearDays(year) { return (getLunarData(year) >> 17) & 0x01ff; }
function getLunarMonthDays(year, month, isIntercalation) {
  var lunarData = getLunarData(year);
  var isBigMonth = (isIntercalation && getLunarIntercalationMonth(lunarData) === month)
    ? ((lunarData >> 16) & 0x01) > 0
    : ((lunarData >> (12 - month)) & 0x01) > 0;
  return isBigMonth ? D.LUNAR_BIG_MONTH_DAY : D.LUNAR_SMALL_MONTH_DAY;
}

function accumulateYearDays(year, cache, perYear) {
  if (cache[year] !== undefined) return cache[year];
  var baseYear = D.KOREAN_LUNAR_BASE_YEAR;
  var days = 0;
  if (cache[year - 1] !== undefined && year > baseYear) {
    days = cache[year - 1] + perYear(year);
  } else {
    for (var y = baseYear; y < year + 1; y++) days += perYear(y);
  }
  cache[year] = days;
  return days;
}

function getLunarDaysBeforeBaseYear(year) { return accumulateYearDays(year, lunarYearDaysCache, getLunarYearDays); }
function getLunarDaysBeforeBaseMonth(year, month, isIntercalation) {
  var days = 0;
  if (year >= D.KOREAN_LUNAR_BASE_YEAR && month > 0) {
    for (var baseMonth = 1; baseMonth < month + 1; baseMonth++) days += getLunarMonthDays(year, baseMonth, false);
    if (isIntercalation) {
      var im = getLunarIntercalationMonth(getLunarData(year));
      if (im > 0 && im < month + 1) days += getLunarMonthDays(year, im, true);
    }
  }
  return days;
}
function getLunarAbsDays(year, month, day, isIntercalation) {
  var days = getLunarDaysBeforeBaseYear(year - 1) + getLunarDaysBeforeBaseMonth(year, month - 1, true) + day;
  if (isIntercalation && getLunarIntercalationMonth(getLunarData(year)) === month) days += getLunarMonthDays(year, month, false);
  return days;
}

function isSolarIntercalationYear(lunarData) { return ((lunarData >> 30) & 0x01) > 0; }
function getSolarYearDays(year) { return isSolarIntercalationYear(getLunarData(year)) ? D.SOLAR_BIG_YEAR_DAY : D.SOLAR_SMALL_YEAR_DAY; }
function getSolarMonthDays(year, month) {
  if (month === 2 && isSolarIntercalationYear(getLunarData(year))) return D.SOLAR_DAYS[12];
  return D.SOLAR_DAYS[month - 1];
}
function getSolarDaysBeforeBaseYear(year) { return accumulateYearDays(year, solarYearDaysCache, getSolarYearDays); }
function getSolarDaysBeforeBaseMonth(year, month) {
  var days = 0;
  for (var baseMonth = 1; baseMonth < month + 1; baseMonth++) days += getSolarMonthDays(year, baseMonth);
  return days;
}
function getSolarAbsDays(year, month, day) {
  return getSolarDaysBeforeBaseYear(year - 1) + getSolarDaysBeforeBaseMonth(year, month - 1) + day - D.SOLAR_LUNAR_DAY_DIFF;
}

function checkValidDate(isLunar, isIntercalation, year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  var dateValue = year * 10000 + month * 100 + day;
  var minV = isLunar ? D.KOREAN_LUNAR_MIN_VALUE : D.KOREAN_SOLAR_MIN_VALUE;
  var maxV = isLunar ? D.KOREAN_LUNAR_MAX_VALUE : D.KOREAN_SOLAR_MAX_VALUE;
  if (dateValue < minV || dateValue > maxV) return false;
  if (!(month > 0 && month < 13 && day > 0)) return false;
  if (isLunar && isIntercalation && getLunarIntercalationMonth(getLunarData(year)) !== month) return false;
  var dayLimit = isLunar ? getLunarMonthDays(year, month, isIntercalation) : getSolarMonthDays(year, month);
  if (!isLunar && year === 1582 && month === 10 && day > 4 && day < 15) return false;
  return day <= dayLimit;
}

/* 양력 -> 음력 */
function solarToLunar(solarYear, solarMonth, solarDay) {
  if (!checkValidDate(false, false, solarYear, solarMonth, solarDay)) return { valid: false };
  var absDays = getSolarAbsDays(solarYear, solarMonth, solarDay);
  var lunarYear = (absDays >= getLunarAbsDays(solarYear, 1, 1, false)) ? solarYear : solarYear - 1;
  var lunarMonth = 0, lunarDay = 0, isIntercalation = false;
  for (var month = 12; month > 0; month--) {
    var absDaysByMonth = getLunarAbsDays(lunarYear, month, 1, false);
    if (absDays >= absDaysByMonth) {
      lunarMonth = month;
      if (getLunarIntercalationMonth(getLunarData(lunarYear)) === month) {
        isIntercalation = absDays >= getLunarAbsDays(lunarYear, month, 1, true);
      }
      lunarDay = absDays - getLunarAbsDays(lunarYear, lunarMonth, 1, isIntercalation) + 1;
      break;
    }
  }
  return { valid: true, year: lunarYear, month: lunarMonth, day: lunarDay, intercalation: isIntercalation };
}

/* 음력 -> 양력 */
function lunarToSolar(lunarYear, lunarMonth, lunarDay, isIntercalation) {
  if (!checkValidDate(true, isIntercalation, lunarYear, lunarMonth, lunarDay)) return { valid: false };
  var fixedIntercalation = isIntercalation && getLunarIntercalationMonth(getLunarData(lunarYear)) === lunarMonth;
  var absDays = getLunarAbsDays(lunarYear, lunarMonth, lunarDay, fixedIntercalation);
  var solarYear = (absDays < getSolarAbsDays(lunarYear + 1, 1, 1)) ? lunarYear : lunarYear + 1;
  var solarMonth = 0, solarDay = 0;
  for (var month = 12; month > 0; month--) {
    var absDaysByMonth = getSolarAbsDays(solarYear, month, 1);
    if (absDays >= absDaysByMonth) {
      solarMonth = month;
      solarDay = absDays - absDaysByMonth + 1;
      break;
    }
  }
  return { valid: true, year: solarYear, month: solarMonth, day: solarDay };
}

function hasIntercalationMonth(year) { return getLunarIntercalationMonth(getLunarData(year)); }

/* ---------- 간지(干支) ---------- */
var KOREAN_CHEONGAN = [0xac11,0xc744,0xbcd1,0xc815,0xbb34,0xae30,0xacbd,0xc2e0,0xc784,0xacc4].map(function(c){return String.fromCharCode(c);});
var KOREAN_GANJI = [0xc790,0xcd95,0xc778,0xbb18,0xc9c4,0xc0ac,0xc624,0xbbf8,0xc2e0,0xc720,0xc220,0xd574].map(function(c){return String.fromCharCode(c);});
var GAPJA_OFFSET = { YEAR_CHEONGAN: 6, YEAR_GANJI: 0, MONTH_CHEONGAN: 3, MONTH_GANJI: 1, DAY_CHEONGAN: 4, DAY_GANJI: 2 };

function getGapja(lunarYear, lunarMonth, lunarDay, isIntercalation) {
  var absDays = getLunarAbsDays(lunarYear, lunarMonth, lunarDay, isIntercalation);
  if (absDays <= 0) return null;
  var baseYear = D.KOREAN_LUNAR_BASE_YEAR;
  var cheonganLen = KOREAN_CHEONGAN.length, ganjiLen = KOREAN_GANJI.length;
  var monthCount = lunarMonth + 12 * (lunarYear - baseYear);
  function mod(n, m) { return ((n % m) + m) % m; }
  var yCheongan = mod(lunarYear + GAPJA_OFFSET.YEAR_CHEONGAN - baseYear, cheonganLen);
  var yGanji = mod(lunarYear + GAPJA_OFFSET.YEAR_GANJI - baseYear, ganjiLen);
  var mCheongan = mod(monthCount + GAPJA_OFFSET.MONTH_CHEONGAN, cheonganLen);
  var mGanji = mod(monthCount + GAPJA_OFFSET.MONTH_GANJI, ganjiLen);
  var dCheongan = mod(absDays + GAPJA_OFFSET.DAY_CHEONGAN, cheonganLen);
  var dGanji = mod(absDays + GAPJA_OFFSET.DAY_GANJI, ganjiLen);
  return {
    year: KOREAN_CHEONGAN[yCheongan] + KOREAN_GANJI[yGanji] + '년',
    month: KOREAN_CHEONGAN[mCheongan] + KOREAN_GANJI[mGanji] + '월',
    day: KOREAN_CHEONGAN[dCheongan] + KOREAN_GANJI[dGanji] + '일'
  };
}

/* =========================================================
   DOM 연결
   ========================================================= */
var $ = function (id) { return document.getElementById(id); };

var el = {
  modeRadios: document.querySelectorAll('input[name="mode"]'),
  dateTitle: $('date-title'), dateLabel: $('date-label'),
  y: $('date-y'), m: $('date-m'), d: $('date-d'),
  leapWrap: $('leap-wrap'), leapCheck: $('leap-check'), leapMonthNum: $('leap-month-num'),
  warn: $('warn'),
  headLabel: $('head-label'), headline: $('headline'), headSub: $('head-sub'),
  fYear: $('f-year'), fMonth: $('f-month'), fDay: $('f-day')
};

var YEAR_MIN = 1900, YEAR_MAX = 2050;

function solarDaysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
function formatDate(y, m, d) { return y + '년 ' + m + '월 ' + d + '일'; }

function buildOptions(from, to, selected) {
  var html = '';
  for (var v = from; v <= to; v++) {
    html += '<option value="' + v + '"' + (v === selected ? ' selected' : '') + '>' + v + '</option>';
  }
  return html;
}
function populateYearSelect(select, selected) {
  var html = '';
  for (var y = YEAR_MAX; y >= YEAR_MIN; y--) {
    html += '<option value="' + y + '"' + (y === selected ? ' selected' : '') + '>' + y + '</option>';
  }
  select.innerHTML = html;
}
function populateMonthSelect(select, selected) { select.innerHTML = buildOptions(1, 12, selected); }
function populateDaySelect(select, maxDay, selected) { select.innerHTML = buildOptions(1, maxDay, selected); }

function currentMode() {
  var checked = document.querySelector('input[name="mode"]:checked');
  return checked ? checked.value : 's2l';
}

/* 연/월/윤달 체크박스 상태에 맞춰 "일" 옵션과 윤달 체크박스 표시 여부를 갱신한다 */
function syncOptions() {
  var mode = currentMode();
  var y = +el.y.value, m = +el.m.value;

  if (mode === 's2l') {
    el.leapWrap.hidden = true;
    el.leapCheck.checked = false;
    var maxDay = solarDaysInMonth(y, m);
    var wanted = Math.min(+el.d.value || 1, maxDay);
    populateDaySelect(el.d, maxDay, wanted);
  } else {
    var leapMonth = hasIntercalationMonth(y);
    var canBeLeap = leapMonth > 0 && leapMonth === m;
    el.leapWrap.hidden = !canBeLeap;
    if (!canBeLeap) el.leapCheck.checked = false;
    if (canBeLeap) el.leapMonthNum.textContent = leapMonth;

    var isLeap = canBeLeap && el.leapCheck.checked;
    var maxDayLunar = getLunarMonthDays(y, m, isLeap);
    var wantedLunar = Math.min(+el.d.value || 1, maxDayLunar);
    populateDaySelect(el.d, maxDayLunar, wantedLunar);
  }
}

function updateModeLabels() {
  var mode = currentMode();
  if (mode === 's2l') {
    el.dateTitle.textContent = '양력 날짜가 언제인가요?';
    el.dateLabel.textContent = '양력 날짜';
  } else {
    el.dateTitle.textContent = '음력 날짜가 언제인가요?';
    el.dateLabel.textContent = '음력 날짜';
  }
}

function render() {
  var mode = currentMode();
  var y = +el.y.value, m = +el.m.value, d = +el.d.value;
  var isLeapInput = mode === 'l2s' && !el.leapWrap.hidden && el.leapCheck.checked;

  var gapjaY, gapjaM, gapjaD, gapjaLeap;
  var result;

  if (mode === 's2l') {
    result = solarToLunar(y, m, d);
    if (!result.valid) {
      showWarn('입력한 날짜를 변환할 수 없습니다. 날짜를 다시 확인해주세요.');
      return;
    }
    hideWarn();
    el.headLabel.textContent = '음력 날짜';
    el.headline.textContent = formatDate(result.year, result.month, result.day) + (result.intercalation ? ' (윤' + result.month + '월)' : '');
    el.headSub.textContent = '양력 ' + formatDate(y, m, d) + ' 기준';
    gapjaY = result.year; gapjaM = result.month; gapjaD = result.day; gapjaLeap = result.intercalation;
  } else {
    result = lunarToSolar(y, m, d, isLeapInput);
    if (!result.valid) {
      showWarn('입력한 날짜를 변환할 수 없습니다. 날짜를 다시 확인해주세요.');
      return;
    }
    hideWarn();
    el.headLabel.textContent = '양력 날짜';
    el.headline.textContent = formatDate(result.year, result.month, result.day);
    el.headSub.textContent = '음력 ' + formatDate(y, m, d) + (isLeapInput ? ' (윤' + m + '월)' : '') + ' 기준';
    gapjaY = y; gapjaM = m; gapjaD = d; gapjaLeap = isLeapInput;
  }

  var gapja = getGapja(gapjaY, gapjaM, gapjaD, gapjaLeap);
  if (gapja) {
    el.fYear.textContent = gapja.year;
    el.fMonth.textContent = gapja.month;
    el.fDay.textContent = gapja.day;
  }
}

function showWarn(msg) {
  el.warn.textContent = msg;
  el.warn.hidden = false;
  el.headline.textContent = '-';
  el.headSub.textContent = '-';
  el.fYear.textContent = '-'; el.fMonth.textContent = '-'; el.fDay.textContent = '-';
}
function hideWarn() { el.warn.hidden = true; }

function onYearOrMonthChange() {
  syncOptions();
  render();
}

/* ---------- 시작 ---------- */
var today = new Date();
populateYearSelect(el.y, today.getFullYear());
populateMonthSelect(el.m, today.getMonth() + 1);
populateDaySelect(el.d, solarDaysInMonth(today.getFullYear(), today.getMonth() + 1), today.getDate());

Array.prototype.forEach.call(el.modeRadios, function (radio) {
  radio.addEventListener('change', function () {
    updateModeLabels();
    syncOptions();
    render();
  });
});

el.y.addEventListener('change', onYearOrMonthChange);
el.m.addEventListener('change', onYearOrMonthChange);
el.d.addEventListener('change', render);
el.leapCheck.addEventListener('change', function () { syncOptions(); render(); });

updateModeLabels();
syncOptions();
render();
