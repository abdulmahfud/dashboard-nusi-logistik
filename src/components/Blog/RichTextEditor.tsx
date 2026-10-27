"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
  Undo2,
  Redo2,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadPostContentImage } from "@/lib/apiClient";

const IMAGE_ACCEPT = "image/jpeg,image/jpg,image/png";
const IMAGE_MAX_BYTES = 2000 * 1024; // 2MB, sama dengan validasi BE

const toolbarBtn =
  "flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40";
const toolbarBtnActive = "bg-blue-100 text-blue-700";

type ImageAlign = "left" | "center" | "right";
const IMAGE_WIDTH_PRESETS = [
  { label: "25%", value: "25%" },
  { label: "50%", value: "50%" },
  { label: "75%", value: "75%" },
  { label: "100%", value: "100%" },
];

/**
 * Image bawaan TipTap tidak punya atribut ukuran/alignment - extend di sini
 * supaya admin bisa atur lebar & perataan gambar yang disisipkan di isi
 * artikel. Disimpan sebagai style inline di <img> (width + float/margin)
 * supaya tetap tampil benar di halaman publik (FE cuma sanitize-html, tidak
 * menghapus style inline pada img - lihat SANITIZE_OPTIONS di
 * frontend-cargo/src/app/blog/[slug]/page.tsx).
 */
const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => element.style.width || "100%",
        renderHTML: (attributes) => ({
          style: `width: ${attributes.width}`,
        }),
      },
      align: {
        default: "center" as ImageAlign,
        parseHTML: (element) => {
          if (element.style.float === "left") return "left";
          if (element.style.float === "right") return "right";
          return "center";
        },
        renderHTML: (attributes) => {
          const align = attributes.align as ImageAlign;
          if (align === "left") {
            return { style: "float: left; margin: 0 1rem 1rem 0;" };
          }
          if (align === "right") {
            return { style: "float: right; margin: 0 0 1rem 1rem;" };
          }
          return {
            style: "display: block; margin-left: auto; margin-right: auto;",
          };
        },
      },
    };
  },
});

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showHtmlView, setShowHtmlView] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      ResizableImage.configure({
        HTMLAttributes: { class: "rounded-lg" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Tulis isi artikel di sini...",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none min-h-[300px] focus:outline-none px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sinkronkan kalau value diganti dari luar (mis. saat data edit baru selesai dimuat).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-[340px] rounded-lg border border-slate-200 bg-slate-50" />
    );
  }

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL tautan", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleImageFile = async (file: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Gunakan JPEG atau PNG.");
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error(
        `Maks. ${(IMAGE_MAX_BYTES / 1024 / 1024).toFixed(0)} MB (ini ${(file.size / 1024 / 1024).toFixed(2)} MB).`
      );
      return;
    }

    setUploadingImage(true);
    try {
      const res = await uploadPostContentImage(file);
      if (res.success && res.url) {
        editor.chain().focus().setImage({ src: res.url }).run();
      } else {
        toast.error(res.message || "Gagal mengunggah gambar.");
      }
    } catch (err) {
      console.error("Failed to upload content image:", err);
      toast.error("Gagal mengunggah gambar.");
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleHtmlView = () => {
    if (!showHtmlView) {
      // Buka tampilan HTML: ambil konten terbaru dari editor ke textarea.
      setHtmlDraft(editor.getHTML());
      setShowHtmlView(true);
      return;
    }
    // Tutup tampilan HTML: tulis balik hasil edit textarea ke editor.
    editor.commands.setContent(htmlDraft || "");
    onChange(editor.getHTML());
    setShowHtmlView(false);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50/60 p-1.5">
        <button
          type="button"
          className={cn(
            toolbarBtn,
            editor.isActive("bold") && toolbarBtnActive
          )}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={showHtmlView}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            toolbarBtn,
            editor.isActive("italic") && toolbarBtnActive
          )}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={showHtmlView}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            toolbarBtn,
            editor.isActive("underline") && toolbarBtnActive
          )}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={showHtmlView}
          aria-label="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            toolbarBtn,
            editor.isActive("strike") && toolbarBtnActive
          )}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={showHtmlView}
          aria-label="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />

        <button
          type="button"
          className={cn(
            toolbarBtn,
            editor.isActive("heading", { level: 2 }) && toolbarBtnActive
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={showHtmlView}
          aria-label="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            toolbarBtn,
            editor.isActive("heading", { level: 3 }) && toolbarBtnActive
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          disabled={showHtmlView}
          aria-label="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />

        <button
          type="button"
          className={cn(
            toolbarBtn,
            editor.isActive("bulletList") && toolbarBtnActive
          )}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={showHtmlView}
          aria-label="Bullet list"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            toolbarBtn,
            editor.isActive("orderedList") && toolbarBtnActive
          )}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={showHtmlView}
          aria-label="Ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            toolbarBtn,
            editor.isActive("blockquote") && toolbarBtnActive
          )}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={showHtmlView}
          aria-label="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            toolbarBtn,
            editor.isActive("link") && toolbarBtnActive
          )}
          onClick={setLink}
          disabled={showHtmlView}
          aria-label="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage || showHtmlView}
          aria-label="Sisipkan gambar"
        >
          {uploadingImage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={(e) => {
            void handleImageFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />

        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />

        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || showHtmlView}
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || showHtmlView}
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />

        <button
          type="button"
          className={cn(toolbarBtn, showHtmlView && toolbarBtnActive)}
          onClick={toggleHtmlView}
          aria-label="Lihat HTML"
          title="Lihat/edit kode HTML"
        >
          <Code2 className="h-4 w-4" />
        </button>
      </div>

      {showHtmlView ? (
        <textarea
          value={htmlDraft}
          onChange={(e) => setHtmlDraft(e.target.value)}
          spellCheck={false}
          className="min-h-[300px] w-full resize-y border-0 px-4 py-3 font-mono text-xs text-slate-700 focus:outline-none"
          placeholder="<p>Kode HTML artikel...</p>"
        />
      ) : (
        <>
          <EditorContent
            editor={editor}
            className="[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
          />
          <BubbleMenu
            editor={editor}
            shouldShow={({ editor: ed }) => ed.isActive("image")}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
          >
            <button
              type="button"
              className={cn(
                toolbarBtn,
                editor.isActive("image", { align: "left" }) &&
                  toolbarBtnActive
              )}
              onClick={() =>
                editor.chain().focus().updateAttributes("image", { align: "left" }).run()
              }
              aria-label="Rata kiri"
              title="Rata kiri"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                toolbarBtn,
                editor.isActive("image", { align: "center" }) &&
                  toolbarBtnActive
              )}
              onClick={() =>
                editor.chain().focus().updateAttributes("image", { align: "center" }).run()
              }
              aria-label="Rata tengah"
              title="Rata tengah"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                toolbarBtn,
                editor.isActive("image", { align: "right" }) &&
                  toolbarBtnActive
              )}
              onClick={() =>
                editor.chain().focus().updateAttributes("image", { align: "right" }).run()
              }
              aria-label="Rata kanan"
              title="Rata kanan"
            >
              <AlignRight className="h-4 w-4" />
            </button>

            <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />

            {IMAGE_WIDTH_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100",
                  editor.isActive("image", { width: preset.value }) &&
                    toolbarBtnActive
                )}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("image", { width: preset.value })
                    .run()
                }
              >
                {preset.label}
              </button>
            ))}
          </BubbleMenu>
        </>
      )}
    </div>
  );
}
