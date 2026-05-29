import React, { useEffect, useRef, useState } from "react";

const FabricComposer = ({ onExportImage }) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;

    const setup = async () => {
      const fabric = await import("fabric");

      if (disposed || !canvasRef.current) {
        return;
      }

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 680,
        height: 420,
        backgroundColor: "#f8fafc",
        preserveObjectStacking: true
      });

      const panel = new fabric.Rect({
        left: 48,
        top: 46,
        width: 584,
        height: 328,
        rx: 18,
        ry: 18,
        fill: "#ffffff",
        stroke: "#dbe3ef",
        shadow: new fabric.Shadow({
          color: "rgba(15, 23, 42, 0.18)",
          blur: 24,
          offsetY: 12
        })
      });

      const headline = new fabric.Textbox("Premium Campaign Creative", {
        left: 86,
        top: 92,
        width: 420,
        fill: "#0f172a",
        fontSize: 34,
        fontWeight: 800,
        fontFamily: "Inter, Arial",
        lineHeight: 1.08
      });

      const copy = new fabric.Textbox("Design a hero image, coupon graphic, or branded visual and export it into your email template.", {
        left: 88,
        top: 184,
        width: 410,
        fill: "#64748b",
        fontSize: 16,
        fontFamily: "Inter, Arial",
        lineHeight: 1.45
      });

      const badge = new fabric.Rect({
        left: 88,
        top: 270,
        width: 174,
        height: 42,
        rx: 21,
        ry: 21,
        fill: "#0f766e"
      });

      const badgeText = new fabric.Text("Export to Image", {
        left: 112,
        top: 282,
        fill: "#ffffff",
        fontSize: 14,
        fontWeight: 800,
        fontFamily: "Inter, Arial"
      });

      const accent = new fabric.Circle({
        left: 508,
        top: 118,
        radius: 56,
        fill: "#dbeafe"
      });

      const accentTwo = new fabric.Rect({
        left: 530,
        top: 212,
        width: 70,
        height: 70,
        rx: 16,
        ry: 16,
        fill: "#ccfbf1",
        angle: 10
      });

      canvas.add(panel, accent, accentTwo, headline, copy, badge, badgeText);
      canvas.setActiveObject(headline);
      fabricCanvasRef.current = canvas;
      setReady(true);
    };

    setup();

    return () => {
      disposed = true;
      fabricCanvasRef.current?.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    import("fabric").then((fabric) => {
      const text = new fabric.Textbox("New text", {
        left: 110,
        top: 120,
        width: 260,
        fill: "#0f172a",
        fontSize: 24,
        fontWeight: 700,
        fontFamily: "Inter, Arial"
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.requestRenderAll();
    });
  };

  const addShape = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    import("fabric").then((fabric) => {
      const shape = new fabric.Rect({
        left: 420,
        top: 220,
        width: 112,
        height: 72,
        rx: 14,
        ry: 14,
        fill: "#fde68a",
        stroke: "#f59e0b"
      });
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.requestRenderAll();
    });
  };

  const exportImage = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    const image = canvas.toDataURL({
      format: "png",
      multiplier: 2,
      quality: 1
    });

    onExportImage?.(image);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-teal-700">Fabric.js Composer</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">Visual Creative Builder</h3>
          <p className="mt-1 text-sm text-slate-500">Create Canva-style graphics, then export them into an email image block.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addText} disabled={!ready} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Text
          </button>
          <button type="button" onClick={addShape} disabled={!ready} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Shape
          </button>
          <button type="button" onClick={exportImage} disabled={!ready} className="rounded-md bg-[#0f766e] px-3 py-2 text-sm font-black text-white hover:bg-[#115e59] disabled:opacity-50">
            Export Image
          </button>
        </div>
      </div>
      <div className="overflow-auto bg-slate-50 p-4">
        <canvas ref={canvasRef} className="mx-auto block rounded-lg border border-slate-200 bg-white shadow-sm" />
      </div>
    </section>
  );
};

export default FabricComposer;
