// Usage: swift -module-cache-path /tmp/mahjong-swift-cache scripts/export-mahjong-glyphs.swift font.ttf > glyphs.json
// Builds fixed SVG outlines from LXGW WenKai TC Bold (SIL OFL); no font is shipped or loaded at runtime.
import Foundation
import CoreText
import CoreGraphics
let url = URL(fileURLWithPath: CommandLine.arguments[1])
guard let provider = CGDataProvider(url: url as CFURL), let cg = CGFont(provider) else { fatalError("Cannot load font") }
let font = CTFontCreateWithGraphicsFont(cg, 1000, nil, nil)
var result: [String:Any] = [:]
func number(_ n: CGFloat) -> String { String(format: "%.2f", Double(n)).replacingOccurrences(of: #"\.?0+$"#, with: "", options: .regularExpression) }
func point(_ p: CGPoint) -> String { "\(number(p.x)) \(number(p.y))" }
for ch in "一二三四伍六七八九萬東南西北中發梅蘭菊竹春夏秋冬1234" {
    let text = String(ch)
    var utf = Array(text.utf16), glyph = [CGGlyph](repeating: 0, count: 1)
    guard CTFontGetGlyphsForCharacters(font, &utf, &glyph, 1), glyph[0] != 0,
          let outline = CTFontCreatePathForGlyph(font, glyph[0], nil) else { fatalError("Missing glyph: \(ch)") }
    var d = ""
    outline.applyWithBlock { ptr in
        let e = ptr.pointee, p = e.points
        switch e.type {
        case .moveToPoint: d += "M" + point(p[0])
        case .addLineToPoint: d += "L" + point(p[0])
        case .addQuadCurveToPoint: d += "Q" + point(p[0]) + " " + point(p[1])
        case .addCurveToPoint: d += "C" + point(p[0]) + " " + point(p[1]) + " " + point(p[2])
        case .closeSubpath: d += "Z"
        @unknown default: fatalError("Unknown path element")
        }
    }
    var advance = CGSize.zero
    CTFontGetAdvancesForGlyphs(font, .horizontal, &glyph, &advance, 1)
    result[text] = ["d": d, "advance": advance.width]
}
let data = try JSONSerialization.data(withJSONObject: result, options: [.sortedKeys])
print(String(data: data, encoding: .utf8)!)
