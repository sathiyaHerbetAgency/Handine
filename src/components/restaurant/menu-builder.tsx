"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../supabase/client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PlusCircle,
  Loader2,
  GripVertical,
  Edit,
  Trash,
  Save,
  Image as ImageIcon,
} from "lucide-react";

type MenuItem = {
  id?: string;
  section_id?: string;
  name: string;
  description: string;
  price: number;
  discount_percent: number;
  image_url?: string;
  is_available: boolean;
  display_order: number;
};

type MenuSection = {
  id?: string;
  restaurant_id?: string;
  name: string;
  description: string;
  discount_percent: number;
  display_order: number;
  menu_items?: MenuItem[];
  isExpanded?: boolean;
  isNew?: boolean;
};

type Restaurant = {
  id: string;
  name: string;
  description?: string;
  primary_color?: string;
};

type Props = {
  restaurant: Restaurant;
  initialSections: MenuSection[];
};

const IMAGE_BUCKET = "menu-images";

export default function RestaurantMenuBuilder({
  restaurant,
  initialSections,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  // State
  const [sections, setSections] = useState<MenuSection[]>(() =>
    initialSections.length > 0
      ? initialSections.map((s) => ({
          ...s,
          isExpanded: false,
          menu_items: s.menu_items || [],
        }))
      : [
          {
            restaurant_id: restaurant.id,
            name: "Main Menu",
            description: "Our delicious offerings",
            discount_percent: 0,
            display_order: 0,
            menu_items: [],
            isExpanded: true,
            isNew: true,
          },
        ]
  );
  const [editingSection, setEditingSection] = useState<MenuSection | null>(
    null
  );
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DnD sensors
  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const itemSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ─── Section CRUD ─────────────────────────────────────────────────────────

  const addSection = () => {
    const newSec: MenuSection = {
      restaurant_id: restaurant.id,
      name: "New Section",
      description: "",
      discount_percent: 0,
      display_order: sections.length,
      menu_items: [],
      isExpanded: true,
      isNew: true,
    };
    setSections((prev) => [...prev, newSec]);
    setEditingSection(newSec);
  };

  useEffect(() => {
    if (initialSections.length === 0) {
      const ds = sections.find((s) => s.isNew && !s.id);
      if (ds) saveSection(ds);
    }
  }, [sections, initialSections.length]);

  const saveSection = async (sec: MenuSection) => {
    if (!sec.name.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      let sid = sec.id;
      if (!sid) {
        const { data, error } = await supabase
          .from("menu_sections")
          .insert({
            restaurant_id: restaurant.id,
            name: sec.name,
            description: sec.description,
            discount_percent: sec.discount_percent,
            display_order: sec.display_order,
          })
          .select()
          .single();
        if (error) throw error;
        sid = data.id;
      } else {
        const { error } = await supabase
          .from("menu_sections")
          .update({
            name: sec.name,
            description: sec.description,
            discount_percent: sec.discount_percent,
            display_order: sec.display_order,
          })
          .eq("id", sid);
        if (error) throw error;
      }
      setSections((prev) =>
        prev.map((s) =>
          s.id === sec.id || (!s.id && sec.isNew)
            ? { ...sec, id: sid, isNew: false }
            : s
        )
      );
      setEditingSection(null);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save section");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSection = async (sid: string) => {
    if (!confirm("Delete this section?")) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("menu_sections")
        .delete()
        .eq("id", sid);
      if (error) throw error;
      setSections((prev) => prev.filter((s) => s.id !== sid));
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete section");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Item CRUD ────────────────────────────────────────────────────────────

  const handleAddItem = async (section: MenuSection) => {
    let sid = section.id;
    if (!sid) {
      await saveSection(section);
      sid = sections.find(
        (s) => s.display_order === section.display_order && s.id
      )!.id!;
    }
    const newItem: MenuItem = {
      id: `temp-${Date.now()}`, // ensure DnD ids are defined
      section_id: sid,
      name: "New Item",
      description: "",
      price: 0,
      discount_percent: 0,
      is_available: true,
      display_order:
        sections.find((s) => s.id === sid)?.menu_items?.length || 0,
    };
    setSections((prev) =>
      prev.map((s) =>
        s.id === sid
          ? {
              ...s,
              menu_items: [...(s.menu_items || []), newItem],
              isExpanded: true,
            }
          : s
      )
    );
    setEditingItem(newItem);
  };

  const saveItem = async (item: MenuItem, sid: string) => {
    if (!item.name.trim()) {
      setError("Item name is required");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let iid = item.id && item.id.startsWith("temp-") ? undefined : item.id;

      if (!iid) {
        const { data, error } = await supabase
          .from("menu_items")
          .insert({
            section_id: sid,
            name: item.name,
            description: item.description,
            price: item.price,
            discount_percent: item.discount_percent,
            image_url: item.image_url,
            is_available: item.is_available,
            display_order: item.display_order,
          })
          .select()
          .single();
        if (error) throw error;
        iid = data.id;
      } else {
        const { error } = await supabase
          .from("menu_items")
          .update({
            name: item.name,
            description: item.description,
            price: item.price,
            discount_percent: item.discount_percent,
            image_url: item.image_url,
            is_available: item.is_available,
            display_order: item.display_order,
          })
          .eq("id", iid);
        if (error) throw error;
      }

      setSections((prev) =>
        prev.map((s) =>
          s.id === sid
            ? {
                ...s,
                menu_items: s.menu_items?.map((mi) =>
                  mi.id === item.id ? { ...item, id: iid } : mi
                ),
              }
            : s
        )
      );
      setEditingItem(null);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save item");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (iid: string, sid: string) => {
    if (!confirm("Delete this item?")) return;
    setIsLoading(true);
    setError(null);
    try {
      // If the item is still temp (not saved), just remove locally
      if (iid.startsWith("temp-")) {
        setSections((prev) =>
          prev.map((s) =>
            s.id === sid
              ? {
                  ...s,
                  menu_items: s.menu_items?.filter((mi) => mi.id !== iid),
                }
              : s
          )
        );
      } else {
        const { error } = await supabase
          .from("menu_items")
          .delete()
          .eq("id", iid);
        if (error) throw error;
        setSections((prev) =>
          prev.map((s) =>
            s.id === sid
              ? {
                  ...s,
                  menu_items: s.menu_items?.filter((mi) => mi.id !== iid),
                }
              : s
          )
        );
      }
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete item");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Drag & Drop ──────────────────────────────────────────────────────────

  const handleSectionDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIdx = sections.findIndex((s) => s.id === active.id);
      const newIdx = sections.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(sections, oldIdx, newIdx).map((sec, idx) => ({
        ...sec,
        display_order: idx,
      }));
      setSections(reordered);
      await Promise.all(
        reordered
          .filter((sec) => sec.id)
          .map((sec) =>
            supabase
              .from("menu_sections")
              .update({ display_order: sec.display_order })
              .eq("id", sec.id)
          )
      );
    }
  };

  const handleItemDragEnd = async (e: DragEndEvent, sid: string) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const sec = sections.find((s) => s.id === sid)!;
      const oldIdx = sec.menu_items!.findIndex((i) => i.id === active.id);
      const newIdx = sec.menu_items!.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(sec.menu_items!, oldIdx, newIdx).map(
        (it, idx) => ({
          ...it,
          display_order: idx,
        })
      );
      setSections((prev) =>
        prev.map((s) => (s.id === sid ? { ...s, menu_items: newItems } : s))
      );
      await Promise.all(
        newItems
          .filter((it) => it.id && !String(it.id).startsWith("temp-"))
          .map((it) =>
            supabase
              .from("menu_items")
              .update({ display_order: it.display_order })
              .eq("id", it.id)
          )
      );
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <DndContext
        sensors={sectionSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext
          items={sections.filter((s) => !!s.id).map((s) => s.id!)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section, idx) => {
            const isEditingSec =
              !!editingSection && editingSection.id === section.id;
            return (
              <SortableSection
                key={section.id || `new-${idx}`}
                section={section}
                isEditingSection={isEditingSec}
                editingSection={editingSection}
                setEditingSection={setEditingSection}
                saveSection={saveSection}
                deleteSection={deleteSection}
                editingItem={editingItem}
                setEditingItem={setEditingItem}
                saveItem={saveItem}
                deleteItem={deleteItem}
                handleAddItem={handleAddItem}
                itemSensors={itemSensors}
                handleItemDragEnd={handleItemDragEnd}
                isLoading={isLoading}
                sectionDiscount={section.discount_percent}
                restaurantId={restaurant.id}
              />
            );
          })}
        </SortableContext>
      </DndContext>

      <Button variant="outline" className="w-full" onClick={addSection}>
        <PlusCircle className="h-4 w-4 mr-2" /> Add Menu Section
      </Button>
    </div>
  );
}

type SortableSectionProps = {
  section: MenuSection;
  isEditingSection: boolean;
  editingSection: MenuSection | null;
  setEditingSection: React.Dispatch<React.SetStateAction<MenuSection | null>>;
  saveSection: (s: MenuSection) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  editingItem: MenuItem | null;
  setEditingItem: React.Dispatch<React.SetStateAction<MenuItem | null>>;
  saveItem: (item: MenuItem, sectionId: string) => Promise<void>;
  deleteItem: (itemId: string, sectionId: string) => Promise<void>;
  handleAddItem: (section: MenuSection) => void;
  itemSensors: any;
  handleItemDragEnd: (e: DragEndEvent, sectionId: string) => Promise<void>;
  isLoading: boolean;
  sectionDiscount: number;
  restaurantId: string;
};

function SortableSection({
  section,
  isEditingSection,
  editingSection,
  setEditingSection,
  saveSection,
  deleteSection,
  editingItem,
  setEditingItem,
  saveItem,
  deleteItem,
  handleAddItem,
  itemSensors,
  handleItemDragEnd,
  isLoading,
  sectionDiscount,
  restaurantId,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: section.id! });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <GripVertical className="h-5 w-5 text-muted-foreground" />

              {isEditingSection ? (
                <div className="w-full" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingSection!.name}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection!,
                        name: e.target.value,
                      })
                    }
                    placeholder="Section Name"
                    className="w-full border-none bg-transparent font-medium text-lg focus:outline-none"
                    autoFocus
                  />
                  <Textarea
                    value={editingSection!.description}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection!,
                        description: e.target.value,
                      })
                    }
                    placeholder="Section Description"
                    className="w-full mt-2"
                    rows={2}
                  />
                  <div className="mt-2">
                    <Label>Discount (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={editingSection!.discount_percent}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection!,
                          discount_percent: parseFloat(e.target.value),
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <CardTitle className="text-lg">{section.name}</CardTitle>
                  {sectionDiscount > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      {sectionDiscount}% off
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isEditingSection ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => saveSection(editingSection!)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSection(section)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {section.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSection(section.id!)}
                      className="text-red-500"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>

        {(section.isExpanded || isEditingSection) && (
          <CardContent className="pt-4">
            <DndContext
              sensors={itemSensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleItemDragEnd(e, section.id!)}
            >
              <SortableContext
                items={(section.menu_items || []).map((i) => i.id!)}
                strategy={verticalListSortingStrategy}
              >
                {(section.menu_items || []).map((item) => (
                  <SortableItem
                    key={item.id!}
                    item={item}
                    editingItem={editingItem}
                    setEditingItem={setEditingItem}
                    saveItem={saveItem}
                    deleteItem={deleteItem}
                    sectionId={section.id!}
                    sectionDiscount={sectionDiscount}
                    restaurantId={restaurantId}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => handleAddItem(section)}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Menu Item
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

type SortableItemProps = {
  item: MenuItem;
  editingItem: MenuItem | null;
  setEditingItem: React.Dispatch<React.SetStateAction<MenuItem | null>>;
  saveItem: (item: MenuItem, sectionId: string) => Promise<void>;
  deleteItem: (itemId: string, sectionId: string) => Promise<void>;
  sectionId: string;
  sectionDiscount: number;
  restaurantId: string;
};

function SortableItem({
  item,
  editingItem,
  setEditingItem,
  saveItem,
  deleteItem,
  sectionId,
  sectionDiscount,
  restaurantId,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id! });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const isEditing = !!editingItem && editingItem.id === item.id;
  const basePrice = item.price;
  const itemDisc = item.discount_percent;
  const appliedDisc = sectionDiscount > 0 ? sectionDiscount : itemDisc;
  const finalPrice = ((basePrice * (100 - appliedDisc)) / 100).toFixed(2);

  const supabase = createClient();
  const [imgUploading, setImgUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string> => {
    setImgUploading(true);
    try {
      const path = `${restaurantId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
      if (error) throw error;

      const { data: pub } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(data.path);

      return pub.publicUrl;
    } finally {
      setImgUploading(false);
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setEditingItem({ ...editingItem!, image_url: url });
    } catch (err: any) {
      console.error(err);
      // swallow here; parent shows errors for save
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="border rounded-md p-3">
        {isEditing ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              {/* IMAGE UPLOAD */}
              <div className="col-span-1">
                <Label>Dish Image</Label>
                <div className="mt-1 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                    {editingItem?.image_url ? (
                      <img
                        src={editingItem.image_url}
                        alt={editingItem.name || "Preview"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImagePick}
                      disabled={imgUploading}
                    />
                    {imgUploading && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploading...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-3">
                <div>
                  <Label>Item Name *</Label>
                  <Input
                    value={editingItem!.name}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem!,
                        name: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingItem!.price}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem!,
                        price: parseFloat(e.target.value || "0"),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingItem!.description}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem!,
                        description: e.target.value,
                      })
                    }
                    className="mt-1"
                    rows={2}
                  />
                </div>
                {/* **Item Discount Input** stays but disabled when section has discount */}
                <div className="col-span-2">
                  <Label>Item Discount (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={editingItem!.discount_percent}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem!,
                        discount_percent: parseFloat(e.target.value || "0"),
                      })
                    }
                    className="mt-1"
                    disabled={sectionDiscount > 0}
                  />
                  {sectionDiscount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Disabled because section has {sectionDiscount}% off
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => saveItem(editingItem!, sectionId)}
                disabled={imgUploading}
              >
                <Save className="h-4 w-4 mr-2" /> Save Item
              </Button>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-md bg-muted overflow-hidden shrink-0">
                <img
                  src={item.image_url || "/placeholder.jpg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-medium">{item.name}</div>
                {item.description && (
                  <p className="text-sm mt-1">{item.description}</p>
                )}
                {appliedDisc > 0 ? (
                  <p className="text-sm text-green-600 mt-1">
                    {appliedDisc}% off → ₹{finalPrice}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    ₹{basePrice.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingItem(item)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteItem(item.id!, sectionId)}
                className="text-red-500"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
