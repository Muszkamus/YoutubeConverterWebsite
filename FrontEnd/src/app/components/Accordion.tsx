"use client";

import "../styles/accordion.css";
import { useState } from "react";
import { AccordionItemProps, AccordionProps } from "./Accordion.types";

export default function Accordion({ data }: AccordionProps) {
  const [curOpen, setCurOpen] = useState<number | null>(null);
  return (
    <div className="accordion">
      {data.map((el, i) => (
        <AccordionItem
          key={el.id}
          curOpen={curOpen}
          onOpen={setCurOpen}
          title={el.title}
          num={i}
        >
          {el.description}
        </AccordionItem>
      ))}
    </div>
  );
}

function AccordionItem({
  num,
  title,
  curOpen,
  onOpen,
  children,
}: AccordionItemProps) {
  const isOpen = num === curOpen;

  function handleToggle(): void {
    onOpen(isOpen ? null : num);
  }
  return (
    <div
      className={`item ${isOpen ? "open" : ""}`}
      onClick={handleToggle}
      role="button"
      aria-expanded={isOpen}
      onKeyDown={(e) => e.key === "Enter" && handleToggle()}
    >
      <p className="textAccordion">{title}</p>
      {/* <p className="icon">{isOpen ? "-" : "+"}</p> */}
      {isOpen && <p className="content-box">{children}</p>}
    </div>
  );
}
