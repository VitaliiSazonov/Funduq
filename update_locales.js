const fs = require('fs');

const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const ru = JSON.parse(fs.readFileSync('messages/ru.json', 'utf8'));

const amenitiesEn = {
  "Бассейн / джакузи": "Pool / Jacuzzi",
  "Высокоскоростной Wi-Fi": "High-speed Wi-Fi",
  "Кондиционер и отопление": "Air Conditioning & Heating",
  "Бесплатная парковка": "Free Parking",
  "Полноценная кухня": "Full Kitchen",
  "Стиральная и сушильная машина": "Washer & Dryer",
  "Self check-in": "Self check-in",
  "Smart-TV со стримингом": "Smart-TV with streaming",
  "BBQ-зона и outdoor-лонж": "BBQ & Outdoor Lounge",
  "King-size кровати и премиальное бельё": "King-size bed & premium linens",
  "Выделенное рабочее место": "Dedicated workspace",
  "Регулярная профуборка / сервис": "Regular professional cleaning",
  "Детские удобства": "Kids amenities",
  "Pet-friendly": "Pet-friendly",
  "EV-зарядка": "EV charging",
  "Фитнес-зона / доступ в спортзал": "Fitness area / Gym access",
  "Игровая / развлекательная зона": "Gaming / Entertainment area",
  "Усиленная безопасность": "Enhanced security",
  "Water View": "Water View",
  "Mountain View": "Mountain View",
  "City View": "City View"
};

const amenitiesRu = {
  "Бассейн / джакузи": "Бассейн / джакузи",
  "Высокоскоростной Wi-Fi": "Высокоскоростной Wi-Fi",
  "Кондиционер и отопление": "Кондиционер и отопление",
  "Бесплатная парковка": "Бесплатная парковка",
  "Полноценная кухня": "Полноценная кухня",
  "Стиральная и сушильная машина": "Стиральная и сушильная машина",
  "Self check-in": "Self check-in",
  "Smart-TV со стримингом": "Smart-TV со стримингом",
  "BBQ-зона и outdoor-лонж": "BBQ-зона и outdoor-лонж",
  "King-size кровати и премиальное бельё": "King-size кровати и премиальное бельё",
  "Выделенное рабочее место": "Выделенное рабочее место",
  "Регулярная профуборка / сервис": "Регулярная профуборка / сервис",
  "Детские удобства": "Детские удобства",
  "Pet-friendly": "Pet-friendly",
  "EV-зарядка": "EV-зарядка",
  "Фитнес-зона / доступ в спортзал": "Фитнес-зона / доступ в спортзал",
  "Игровая / развлекательная зона": "Игровая / развлекательная зона",
  "Усиленная безопасность": "Усиленная безопасность",
  "Water View": "Вид на воду",
  "Mountain View": "Вид на горы",
  "City View": "Вид на город"
};

en.amenities = amenitiesEn;
ru.amenities = amenitiesRu;

fs.writeFileSync('messages/en.json', JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync('messages/ru.json', JSON.stringify(ru, null, 2) + '\n');

console.log("Locales updated!");
