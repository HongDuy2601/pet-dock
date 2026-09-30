// {owner} = how the pet calls you, {name} = pet's name.
const PHRASES = {
  hello: ['Chào {owner}! {name} đây nè~', '{owner} ơi, {name} tới rồi!', 'Hôm nay làm việc cùng nhau nha {owner}!'],
  click: {
    cat: ['Meo~', 'Meo meo!', 'Vuốt nữa đi {owner}~', 'Hửm?', 'Meo! 💕', 'Đừng chọc {name} mà~'],
    dog: ['Gâu!', 'Gâu gâu!', 'Chơi với em đi {owner}!', 'Ném bóng đi ném bóng đi!', 'Gâu~ 💕', 'Em ngoan mà!'],
    custom: ['Hì hì~', 'Ơi!', '{owner} gọi {name} hả?', 'Yêu {owner} nhất! 💕'],
    pig: ['Ụt ịt!', 'Ụt ụt~ 🐷', 'Gãi bụng {name} đi {owner}!', 'Hì hì, {name} tròn tròn nè~'],
  },
  purr: {
    cat: ['Grừ grừ...', 'Sướng quá đi~', 'Gãi chỗ đó nữa~'],
    dog: ['Hí hí sướng quá!', '*vẫy đuôi lia lịa*', 'Gãi bụng nữa đi!'],
    custom: ['Dễ chịu quá~', 'Thêm chút nữa~'],
    pig: ['Ụt ịt… sướng quá~', 'Gãi chỗ đó nữa đi~ 🐷'],
  },
  wake: ['Ưm... ai gọi đó?', 'Oáp~ {name} dậy rồi!', 'Đang mơ đẹp mà...'],
  feed: ['Măm măm! Ngon quá!', 'Cảm ơn {owner}! 😋', 'No căng bụng rồi~'],
  water: ['{owner} ơi, uống miếng nước đi! 💧', 'Nhắc nhẹ: tới giờ uống nước rồi nha~', '{name} khát, chắc {owner} cũng khát đó. Uống nước nào!'],
  rest: ['Ngồi lâu rồi, đứng dậy vươn vai với {name} đi! 🙆', 'Nghỉ mắt 1 chút nha {owner}, nhìn ra xa xa~', 'Đi bộ vài bước rồi quay lại nha!'],
  chatter: {
    cat: ['*liếm lông*', '{owner} làm gì đó?', 'Có con chuột trên màn hình kìa!', 'Buồn ngủ ghê...', '{name} ở đây với {owner} nè~'],
    dog: ['*đánh hơi đánh hơi*', '{owner} ơi đi dạo không?', 'Em canh màn hình cho nha!', '{name} ở đây với {owner} nè~'],
    custom: ['{name} ở đây nè~', 'Cố lên {owner}!', 'Hôm nay ổn không {owner}?'],
    pig: ['*ủi ủi mũi*', '{owner} có gì ăn không~?', '{name} canh màn hình cho {owner} nè!', 'Ụt ịt, làm tiếp đi {owner}!'],
  },
  night: ['Khuya rồi, {owner} đi ngủ sớm nha... 🌙', '{name} buồn ngủ quá, {owner} cũng nghỉ đi~'],
  sleepCmd: ['Chúc {owner} ngủ ngon~', 'Oáp... {name} ngủ đây'],

  // v0.3 — gentle care
  stretch: ['Ngồi lâu rồi đó, vươn vai giống {name} nè~ 🙆', '{name} vươn vai nè, {owner} làm theo đi!', 'Duỗi người chút cho đỡ mỏi nha {owner}~'],
  back: ['{owner} về rồi hả~', 'A, {owner} đây rồi! 💕', 'Nghỉ xong rồi hả {owner}? Làm tiếp nào~'],
  breatheStart: ['Mình thở chậm cùng nhau 1 phút nha~', 'Thả lỏng vai, thở theo {name} nè'],
  breatheIn: ['Hít vào…'],
  breatheOut: ['Thở ra… từ từ thôi'],
  breatheEnd: ['Nhẹ lòng hơn chút chưa {owner}? 🌿', 'Giỏi lắm! Lúc nào mệt thì mình thở cùng nhau nha', 'Rồi đó, {owner} làm tốt lắm 💕'],
  // Vent corner. Validate first, never minimise, never rush anyone to feel better.
  vent: ['{name} cất chuyện đó đi giúp {owner} rồi nha.', 'Măm… {name} giữ chuyện đó giùm {owner}.', 'Xong rồi. Tờ giấy đi rồi, còn {name} ở lại.'],
  comfort: {
    general: {
      validate: ['Cảm ơn {owner} đã kể cho {name} nghe.', 'Nói ra được là giỏi lắm rồi đó.', 'Chuyện đó chắc làm {owner} khó chịu lắm.'],
      support: ['{name} không sửa được chuyện đó, nhưng {name} ở đây với {owner}.', 'Cảm xúc của {owner} là thật, và nó hợp lý.'],
    },
    tired: {
      validate: ['Nghe mệt thật đó {owner}…', 'Hôm nay {owner} gồng nhiều quá rồi.', 'Mệt đến vậy mà {owner} vẫn cố, {name} thương ghê.'],
      support: ['Mệt thì mình nghỉ một chút, không sao hết.', '{owner} không cần phải ổn ngay đâu.', 'Làm được tới đây là nhiều lắm rồi.'],
    },
    angry: {
      validate: ['Bực thật đó! Gặp {name} chắc {name} cũng xù lông luôn.', 'Chuyện đó đáng bực mà, {owner} không vô lý đâu.', 'Bị vậy ai mà không tức chứ.'],
      support: ['Cơn giận nào của {owner} cũng được phép có.', 'Giận xong rồi mình thả nó đi từ từ nha.', 'Mình chưa cần làm gì với nó ngay đâu.'],
    },
    sad: {
      validate: ['Nghe buồn quá… {name} ngồi đây với {owner} nha.', 'Buồn thì cứ buồn, không cần giấu {name} đâu.', 'Chắc {owner} đã chịu đựng lâu lắm rồi.'],
      support: ['Khóc một chút cũng được mà.', 'Từ từ thôi, không cần vội vui lên.', '{owner} không phải một mình đâu.'],
    },
    lonely: {
      validate: ['Cảm giác không ai hiểu mình… nặng lòng lắm.', '{name} thấy rồi, {owner} đang thấy lạc lõng.'],
      support: ['{name} vẫn ở đây với {owner} nè.', 'Nếu được, nhắn cho một người bạn thân một câu thôi cũng được?', '{owner} quan trọng hơn {owner} nghĩ nhiều đó.'],
    },
    anxious: {
      validate: ['Nhiều thứ dồn lại một lúc, lo là phải rồi.', 'Áp lực vậy, chắc tim đập nhanh lắm ha.'],
      support: ['Mình làm từng việc nhỏ một thôi nha.', 'Chuyện chưa tới thì để nó chưa tới đã.', 'Giờ này {owner} chỉ cần thở thôi, phần còn lại tính sau.'],
    },
    selfblame: {
      validate: ['{owner} đang khắt khe với bản thân quá đó.', 'Có chuyện không như ý đâu có nghĩa là {owner} tệ.'],
      support: ['Nếu bạn thân của {owner} gặp chuyện này, {owner} sẽ nói gì với họ? Nói câu đó với chính mình nha.', '{owner} đã cố hết sức trong hoàn cảnh đó rồi.'],
    },
  },
  comfortAsk: ['Giờ {owner} muốn làm gì cùng {name}?', '{name} ở đây nè. Mình làm gì tiếp nha?'],
  comfortHug: ['{name} ôm {owner} thật chặt nè 🤗', 'Ôm một cái thật lâu nha…', 'Dựa vào {name} một chút đi.'],
  comfortSit: ['{name} ngồi đây với {owner} nha. Không cần nói gì hết.', 'Mình cứ ngồi yên vậy thôi cũng được.'],
  comfortCrisis: ['{name} ở đây với {owner} nè 💛', '{owner} đã làm một việc rất dũng cảm khi nói ra.'],
  checkIn: ['Lúc nãy {owner} không ổn lắm… giờ đỡ hơn chút nào chưa? 💛', '{name} vẫn nhớ chuyện lúc nãy. {owner} thấy sao rồi?'],
  checkInBetter: ['Vậy là tốt rồi 💛', 'Nghe vậy {name} vui ghê!'],
  checkInNotYet: ['Không sao đâu, từ từ thôi. {name} vẫn ở đây.', 'Chưa ổn cũng không sao cả. Mình làm gì cùng nhau nha?'],
  // Nhà các bé (online)
  onlineUpdate: ['{owner} ơi, có bản Pet Dock {version} mới nè ✨ Tải về không?', 'Psst… Pet Dock {version} ra rồi đó {owner}! Có nhiều thứ vui lắm~'],
  onlineNewPets: ['Nhà các bé có bạn mới: {labels} 🐾 {owner} ghé xem không?', 'Có {count} bạn mới dọn tới xóm mình nè! ({labels})'],
  onlineLater: ['Dạ, để khi khác nha~', 'Okie, {name} nhắc sau nha!'],
  // Bé quản gia
  butlerHello: ['Từ giờ {name} trông chừng file giùm {owner} nha 🧹', '{name} làm quản gia cho {owner} nè! Cần dọn gì cứ gọi bé~'],
  tidySuggest: ['{folder} của {owner} có {count} file rồi nè, để {name} dọn giúp nha?', 'Ui, {folder} hơi bừa rồi ({count} file). {name} xếp gọn giùm {owner} không?'],
  tidyCarry: ['Hì hục…', 'Cất cái này…', 'Nặng ghê 😤', 'Sắp xong rồi!', 'Cái này vô đây nè~', 'Một chuyến nữa!'],
  choreStart: ['Để {name} dọn cho! Xem {name} làm nè 🧹', 'Bắt đầu dọn nha {owner}~ 💪'],
  choreBusy: ['{name} đang dọn dở nè, chờ xíu nha~', 'Suỵt, {name} đang làm việc 🧹'],
  choreStopped: ['Ơ, {name} dừng lại nha. Phần chưa cất vẫn để y chỗ cũ~', 'Tạm dừng nè. Cái nào cất rồi thì vào Lịch sử hoàn tác được nha'],
  pushStart: ['Hây dô… đẩy vô sọt nè!', 'Để {name} đẩy nó vô sọt~'],
  storeStart: ['{name} mang qua đó cho nha!', 'Để {name} cất giùm~'],
  tidyDone: ['Xong rồi! Gọn gàng ghê 🧹✨', 'Dọn xong rồi nè {owner}! Muốn trả lại thì vào Lịch sử nha'],
  dropAsk: ['{owner} đưa {name} “{file}” nè. Làm gì với nó đây?', 'Nhận “{file}” rồi nha! {owner} muốn {name} làm gì?'],
  dropAskMany: ['{owner} đưa {name} {count} file nè. Làm gì với chúng đây?'],
  trashAsk: ['Bỏ “{file}” vào Thùng rác thật hả {owner}?', 'Chắc chưa nè? {name} bỏ vào Thùng rác đó nha.'],
  trashDone: ['Bỏ vào Thùng rác rồi. Đổi ý thì bấm Hoàn tác nha~', 'Xong! Nó nằm trong Thùng rác, lấy lại được mà.'],
  trashDoneNoUndo: ['Bỏ vào Thùng rác rồi. Đổi ý thì mở Thùng rác lấy lại nha~'],
  storeDone: ['Cất gọn rồi nha {owner} 🗂️', 'Để đúng chỗ rồi nè!'],
  undoDone: ['Trả về chỗ cũ rồi nha~', 'Như chưa có gì xảy ra luôn 😌'],
  opened: ['Mở cho {owner} rồi nè!', 'Đây nè {owner}~'],
  download: ['{owner} vừa tải xong “{file}” nè, mở luôn không?', 'Có file mới về: “{file}”. {name} mở giùm nha?'],
  // Arriving on another screen
  arrive: ['Màn hình này rộng ghê!', 'Qua đây chơi với {owner} nè~', '{name} đi dạo sang đây nè!', 'Ở đây cũng vui ghê~'],
  // Growing up (baby → adult through care)
  grown: ['Oa! {name} lớn rồi nè! 🎉', 'Nhìn nè {owner}, {name} lớn phổng phao luôn!'],
  grownThanks: ['Cảm ơn {owner} đã chăm {name}, và chăm cả chính mình nữa 💛', 'Mỗi lần {owner} uống nước, vươn vai… là {name} lớn thêm một chút đó!'],
  // High five: a small celebration for looking after yourself. Never nags if skipped.
  highFiveAsk: ['Đập tay với {name} nào! 🙌', 'Giơ tay lên nè {owner}~ 🙌'],
  highFiveDone: ['Yeah! {owner} giỏi quá! 🎉', 'Đập tay cái chát! 🙌✨', 'Tuyệt vời luôn {owner} ơi!'],
  waterAsk: ['{owner} ơi, uống miếng nước đi! 💧', 'Tới giờ uống nước rồi nha~ 💧'],
  waterDone: ['Uống nước giỏi quá! Đập tay nè 🙌', 'Ngoan ghê! Đập tay cái nào 💧🙌'],
  stretchDone: ['Vươn vai xong rồi hả? Đập tay nè 🙌', 'Người nhẹ hơn chưa? Đập tay cái nào!'],
  focusHighFive: ['Xong 25 phút rồi! Đập tay cái nào 🙌', 'Tập trung giỏi quá! Đập tay với {name} đi!'],
  focusAfter: ['Giờ vươn vai với {name} một chút nha 🙆', 'Nghỉ 5 phút rồi mình làm tiếp nha~'],
  focusStart: ['{name} ngủ cạnh {owner} nha, cố lên! 🍅', 'Tập trung đi, {name} canh cho~'],
  focusPoke: ['Suỵt… {owner} tập trung tiếp đi~', 'Sắp xong rồi, cố thêm chút nha!'],
  focusEnd: ['Xong 25 phút rồi! Vươn vai với {name} nè 🎉', 'Giỏi quá! Nghỉ 5 phút đi {owner}~'],
};

function pick(list, s, extra = {}) {
  let t = list[Math.floor(Math.random() * list.length)];
  for (const [k, v] of Object.entries(extra)) t = t.replaceAll(`{${k}}`, v);
  return t.replaceAll('{owner}', s.owner || 'Sen').replaceAll('{name}', s.name || 'Mochi');
}
