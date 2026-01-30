type AccordionItemData = {
  id: number;
  title: string;
  description: string;
};

export type AccordionItemProps = {
  num: number;

  title: string;
  curOpen: number | null;
  onOpen: (id: number | null) => void;
  children: React.ReactNode;
};
export type AccordionProps = {
  data: AccordionItemData[];
};
