export interface Database {
  public: {
    Tables: {
      properties: {
        Row: Property;
        Insert: Omit<Property, "id">;
        Update: Partial<Omit<Property, "id">>;
      };
      entities: {
        Row: Entity;
        Insert: Omit<Entity, "id">;
        Update: Partial<Omit<Entity, "id">>;
      };
      ownership_links: {
        Row: OwnershipLink;
        Insert: Omit<OwnershipLink, "id">;
        Update: Partial<Omit<OwnershipLink, "id">>;
      };
      entity_relationships: {
        Row: EntityRelationship;
        Insert: Omit<EntityRelationship, "id">;
        Update: Partial<Omit<EntityRelationship, "id">>;
      };
      signals: {
        Row: Signal;
        Insert: Omit<Signal, "id">;
        Update: Partial<Omit<Signal, "id">>;
      };
    };
  };
}

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  estimated_value: number;
}

export interface Entity {
  id: string;
  name: string;
  type: string;
  registered_state: string;
}

export interface OwnershipLink {
  id: string;
  property_id: string;
  entity_id: string;
  ownership_pct: number;
}

export interface EntityRelationship {
  id: string;
  parent_entity_id: string;
  child_entity_id: string;
  relationship_type: string;
}

export interface Signal {
  id: string;
  entity_id: string;
  signal_type: string;
  description: string;
  confidence: number;
}
