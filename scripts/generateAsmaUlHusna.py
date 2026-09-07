# -*- coding: utf-8 -*-
import json
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[1]
items = json.loads((root / "esma_export.json").read_text(encoding="utf-8"))

# Kaynak: Audacity export WAV'leri
SOURCE_DIR = Path(r"C:\Users\dgknb\Desktop\audicity")
# Allah C.C. (111) ses yok; çalma 000'dan başlar
NO_AUDIO_MPS = {"111"}
FIRST_AUDIO_MP = "000"
EXT = "wav"

out_dir = root / "assets" / "asmaul-husna"
out_dir.mkdir(parents=True, exist_ok=True)

# Eski placeholder mp3'leri temizle
for old in out_dir.glob("*.mp3"):
    old.unlink()

# Kaynak WAV'leri kopyala
copied = 0
missing_audio = set(NO_AUDIO_MPS)
if SOURCE_DIR.is_dir():
    for it in items:
        mp = str(it["mp"]).strip()
        if mp in NO_AUDIO_MPS:
            continue
        src = SOURCE_DIR / f"{mp}.{EXT}"
        dst = out_dir / f"{mp}.{EXT}"
        if src.exists():
            shutil.copy2(src, dst)
            copied += 1
        else:
            missing_audio.add(mp)
            if dst.exists():
                dst.unlink()

catalog_lines = [
    "/** Esmaül Hüsna kataloğu — Word + Audacity WAV. */",
    "export interface AsmaUlHusnaItem {",
    "  id: number;",
    "  mp: string;",
    "  name: string;",
    "  arabic: string;",
    "  turkish: string;",
    "  /** false ise ses yok; kart gösterilir */",
    "  hasAudio: boolean;",
    "}",
    "",
    f"export const ASMA_FIRST_AUDIO_MP = '{FIRST_AUDIO_MP}' as const;",
    f"export const ASMA_AUDIO_EXT = '{EXT}' as const;",
    "",
    "export const ASMAUL_HUSNA: readonly AsmaUlHusnaItem[] = [",
]

for idx, it in enumerate(items, start=1):
    mp = str(it["mp"]).strip()
    has_audio = mp not in missing_audio and (out_dir / f"{mp}.{EXT}").exists()
    entry = {
        "id": idx,
        "mp": mp,
        "name": it["name"],
        "arabic": it["arabic"],
        "turkish": it["turkish"],
        "hasAudio": has_audio,
    }
    catalog_lines.append(f"  {json.dumps(entry, ensure_ascii=False)},")

catalog_lines.extend(
    [
        "] as const;",
        "",
        "export function getAsmaById(id: number): AsmaUlHusnaItem | undefined {",
        "  return ASMAUL_HUSNA.find((item) => item.id === id);",
        "}",
        "",
        "export function getAsmaFirstAudioIndex(): number {",
        "  const index = ASMAUL_HUSNA.findIndex((item) => item.mp === ASMA_FIRST_AUDIO_MP && item.hasAudio);",
        "  return index >= 0 ? index : ASMAUL_HUSNA.findIndex((item) => item.hasAudio);",
        "}",
        "",
        "export function hasAsmaAudio(item: AsmaUlHusnaItem): boolean {",
        "  return item.hasAudio;",
        "}",
        "",
    ]
)

(root / "src" / "constants" / "asmaUlHusna.ts").write_text(
    "\n".join(catalog_lines), encoding="utf-8"
)

audio_lines = [
    f"/** Metro require map — assets/asmaul-husna/{{mp}}.{EXT} */",
    "import type { AsmaUlHusnaItem } from './asmaUlHusna';",
    "",
    "const ASMA_AUDIO_MODULES: Record<string, number> = {",
]
for it in items:
    mp = str(it["mp"]).strip()
    if not (out_dir / f"{mp}.{EXT}").exists():
        continue
    audio_lines.append(
        f"  '{mp}': require('../../assets/asmaul-husna/{mp}.{EXT}'),"
    )
audio_lines.extend(
    [
        "};",
        "",
        "export function getAsmaAudioModule(mp: string): number | null {",
        "  return ASMA_AUDIO_MODULES[mp] ?? null;",
        "}",
        "",
        "export function getAsmaAudioModuleForItem(item: AsmaUlHusnaItem): number | null {",
        "  if (!item.hasAudio) return null;",
        "  return getAsmaAudioModule(item.mp);",
        "}",
        "",
    ]
)

(root / "src" / "constants" / "asmaUlHusnaAudio.ts").write_text(
    "\n".join(audio_lines), encoding="utf-8"
)

(out_dir / "README.md").write_text(
    f"""# Esmaül Hüsna ses dosyaları ({EXT})

Kaynak klasör: `Desktop/audicity`

- `111` → ses yok (Allah C.C. kartı)
- `000.{EXT}` … çalma buradan başlar
- Eksik: {', '.join(sorted(missing_audio - NO_AUDIO_MPS)) or 'yok'}

Dosya yolu:

`assets/asmaul-husna/`
""",
    encoding="utf-8",
)

print(f"copied={copied} missing={sorted(missing_audio)} wavs={len(list(out_dir.glob('*.'+EXT)))}")
