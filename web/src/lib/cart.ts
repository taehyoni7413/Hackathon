import type { CartItem, Menu, MenuOption } from "@/types/models";

export function selectedOptions(menu: Menu, optionIds: string[]): MenuOption[] {
  return menu.options.filter((o) => optionIds.includes(o.id));
}

export function unitPrice(menu: Menu, optionIds: string[]) {
  return (
    menu.price +
    selectedOptions(menu, optionIds).reduce((s, o) => s + (o.price_delta ?? 0), 0)
  );
}

export function lineTotal(menu: Menu, item: CartItem) {
  return unitPrice(menu, item.option_ids) * item.quantity;
}

export function cartTotal(menus: Menu[], items: CartItem[]) {
  return items.reduce((sum, it) => {
    const m = menus.find((x) => x.id === it.menu_id);
    return m ? sum + lineTotal(m, it) : sum;
  }, 0);
}
