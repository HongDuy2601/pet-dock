// On-device guess at how the writer feels. Runs inside the vent window only;
// just the resulting label ever leaves it — never the words.

const FEELINGS = {
  // phrases that suggest the person may not be safe — checked first, overrides everything
  crisis: {
    vi: ['tự tử', 'tự sát', 'không muốn sống', 'chẳng muốn sống', 'muốn chết', 'chết quách', 'chết đi cho xong',
      'không thiết sống', 'kết thúc cuộc đời', 'kết thúc cuộc sống', 'tự làm đau', 'tự làm hại', 'tự hại', 'rạch tay',
      'không muốn tồn tại', 'biến mất mãi mãi', 'sống để làm gì', 'sống làm gì nữa', 'không còn lý do để sống',
      'nhảy lầu', 'uống thuốc ngủ'],
    ascii: ['tu sat', 'khong muon song', 'muon chet', 'ket thuc cuoc doi', 'tu lam dau', 'tu lam hai', 'rach tay', 'nhay lau'],
  },
  selfblame: {
    vi: ['tại mình', 'lỗi của mình', 'lỗi tại mình', 'mình dở', 'mình tệ', 'vô dụng', 'kém cỏi', 'thất bại', 'ngu',
      'không đủ giỏi', 'ghét bản thân', 'mình không xứng'],
    ascii: ['vo dung', 'kem coi', 'that bai', 'tai minh', 'ghet ban than'],
  },
  sad: {
    vi: ['buồn', 'khóc', 'tủi', 'thất vọng', 'chán', 'tổn thương', 'đau lòng', 'nặng lòng', 'trống rỗng', 'tuyệt vọng', 'suy sụp'],
    ascii: ['buon qua', 'that vong', 'ton thuong', 'dau long', 'tuyet vong'],
  },
  lonely: {
    vi: ['cô đơn', 'một mình', 'không ai hiểu', 'không ai quan tâm', 'lạc lõng', 'bị bỏ rơi', 'không ai nghe', 'chẳng ai'],
    ascii: ['co don', 'mot minh', 'khong ai hieu', 'lac long'],
  },
  anxious: {
    vi: ['lo', 'sợ', 'áp lực', 'deadline', 'hồi hộp', 'bất an', 'căng thẳng', 'stress', 'hoảng', 'lo lắng', 'không kịp', 'trễ hạn'],
    ascii: ['ap luc', 'cang thang', 'lo lang', 'bat an'],
  },
  angry: {
    vi: ['bực', 'tức', 'điên', 'ức chế', 'cay', 'ghét', 'cáu', 'khó chịu', 'vô lý', 'bất công', 'nóng máu', 'tức giận'],
    ascii: ['uc che', 'kho chiu', 'bat cong', 'tuc gian', 'buc minh'],
  },
  tired: {
    vi: ['mệt', 'kiệt sức', 'đuối', 'oải', 'quá tải', 'burnout', 'kiệt quệ', 'hết pin', 'tăng ca', 'thức khuya', 'không ngủ được', 'mất ngủ'],
    ascii: ['met moi', 'kiet suc', 'qua tai', 'het pin', 'tang ca', 'mat ngu'],
  },
};

// When scores tie, the heavier feeling wins.
const FEELING_ORDER = ['selfblame', 'sad', 'lonely', 'anxious', 'angry', 'tired'];

const stripMarks = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

function countPhrase(text, phrase) {
  const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, 'gu');
  return (text.match(re) || []).length;
}

// Vietnamese with tone marks is matched exactly (so "chán" never matches "chân");
// a few unambiguous phrases are also matched when typed without marks.
function readFeelings(raw) {
  const text = raw.toLowerCase().normalize('NFC');
  const plain = stripMarks(text);
  const score = (k) => FEELINGS[k].vi.reduce((n, p) => n + countPhrase(text, p), 0)
    + FEELINGS[k].ascii.reduce((n, p) => n + countPhrase(plain, p), 0);
  const crisis = score('crisis') > 0;
  let mood = 'general', best = 0;
  for (const k of FEELING_ORDER) {
    const n = score(k);
    if (n > best) { best = n; mood = k; }
  }
  return { mood, crisis };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { readFeelings, FEELING_ORDER };
