# Иконки «Лукоморье»

Утверждённая композиция: плитка с дубовым листом, цветная колба и башенка.
Исходный рисунок создан встроенным ImageGen; остальные файлы — технические
экспорты этого же рисунка без перерисовки. Все PNG используют профиль sRGB.

## Что брать

| Назначение | Файл или папка |
|---|---|
| App Store | `stores/app-store-1024.png` — 1024 × 1024, RGB, непрозрачный |
| Google Play | `stores/google-play-512.png` — 512 × 512, RGBA, непрозрачный, меньше 1 МБ |
| Другие магазины, универсальные размеры | `stores/universal-256.png`, `universal-512.png`, `universal-1024.png` |
| iPhone и iPad | `ios/AppIcon.appiconset/` — готовый каталог Xcode с `Contents.json` |
| Android launcher | `android/res/mipmap-*/` — пять плотностей, стандартный рисунок и вариант с полями |
| macOS | `macos/AppIcon.appiconset/` и `macos/lukomorye.icns` |
| Windows | `windows/lukomorye.ico` и PNG 44–1024 px |
| Сайт / PWA | `web/` — PNG 16–1024 px, многоразмерная фавиконка ICO и maskable 192/512/1024 |
| Полный набор | `lukomorye-icons.zip` |
| Предпросмотр | `preview.png` и `index.html` |

Обычные иконки квадратные, с заполненным фоном. Закругление магазины и Apple
применяют самостоятельно. Круг и скруглённая форма в предпросмотре показывают
обрезку системой; они не встроены в магазинные файлы.

Для PWA `maskable` композиция уменьшена до 70% ширины исходного квадрата,
фон продолжен в поля. В Android `ic_launcher_round.png` используется та же
композиция с полями на квадратном фоне. Эти Android PNG подходят как растровые
launcher-ресурсы; отдельные слои native adaptive icon или Apple Icon Composer
в этот набор не входят. В проекте Android нужно назначить `android:icon` и
`android:roundIcon` на соответствующие ресурсы в манифесте приложения.

`source/lukomorye-approved-1254.png` — неизменённый оригинал 1254 × 1254.
`source/lukomorye-master-1024.png` — основной мастер 1024 × 1024.
`source/lukomorye-safe-1024.png` — мастер с полями.
`archive/previous-oak-512.png` — предыдущая иконка с дубом.

## Подключение к сайту

Корневые `favicon.ico`, `icon-180.png`, `icon-192.png`, `icon-512.png` и
`icon-maskable-512.png` обновлены из этого набора. Ссылки на страницах,
PWA-манифест и версия офлайн-кэша обновлены вместе с ними.

## Повторный экспорт

Из корня проекта: `python3 scripts/export-app-icons.py` (нужен Pillow).
Скрипт экспортирует размеры, обновляет корневые файлы, проверяет размеры,
цветовой профиль, непрозрачность магазинных PNG и лимит Google Play,
затем пересобирает ZIP. Список PNG находится в `export-manifest.json`.

Технические размеры сверены 8 октября 2026 года:
[Google Play](https://developer.android.com/distribute/google-play/resources/icon-design-specifications),
[Apple: каталог иконок](https://developer.apple.com/documentation/xcode/configuring-your-app-icon),
[Apple: оформление иконок](https://developer.apple.com/design/human-interface-guidelines/app-icons/).

Промпт исходного ImageGen: компактная иконка сборника игр на хвойном фоне
`#102f2d`; впереди кремовая плитка с крупным шалфейным дубовым листом;
слева позади прозрачная колба с коралловым, медовым, мятным и фиолетовым
слоями; справа простая охристая башенка; мягкие тени, крупные формы,
без текста, лесной сцены и дополнительных предметов.
