export type TMXMap = {
  type: "map";
  /** The TMX format version. Was "1.0" so far, and will be incremented to match minor Tiled releases. */
  version: string;
  /** The Tiled version used to save the file (since Tiled 1.0.1). May be a date (for snapshot builds). (optional) */
  tiledversion?: string;
  /** The class of this map (since 1.9, defaults to ""). */
  class?: string;
  /** The compression level to use for tile layer data (defaults to -1, which means to use the algorithm default). */
  compressionlevel?: number;
  /** The map width in tiles. */
  width: number;
  /** The map height in tiles. */
  height: number;
  /** The width of a tile. */
  tilewidth: number;
  /** The height of a tile. */
  tileheight: number;
  /** X coordinate of the parallax origin in pixels (defaults to 0). (since 1.8) */
  parallaxoriginx?: number;
  /** Y coordinate of the parallax origin in pixels (defaults to 0). (since 1.8) */
  parallaxoriginy?: number;
  /**
   * The background color of the map. (optional, may include alpha value since 0.15 in the form #RRGGBB or #AARRGGBB.
   * Defaults to fully transparent.
   */
  backgroundcolor?: string;
  /**
   * Stores the next available ID for new layers. This number is stored to prevent reuse of the same ID after
   * layers have been removed. (since 1.2) (defaults to the highest layer id in the file + 1)
   */
  nextlayerid?: number;
  /**
   * Stores the next available ID for new objects. This number is stored to prevent reuse of the same ID after objects
   * have been removed. (since 0.11) (defaults to the highest object id in the file + 1)
   */
  nextobjectid?: number;
  /**
   * Whether this map is infinite. An infinite map has no fixed size and can grow in all directions. Its layer data is
   * stored in chunks. (0 for false, 1 for true, defaults to 0)
   */
  infinite?: boolean;
} & (
  | {
      /** Map orientation. */
      orientation: "orthogonal";
      /** The order in which tiles on tile layers are rendered. (only supported for orthogonal maps at the moment) */
      renderorder: `${"right" | "left"}-${"down" | "up"}`;
    }
  | {
      /** Map orientation. */
      orientation: "isometric";
    }
  | {
      /** Map orientation. */
      orientation: "staggered";
      /** Determines which axis ("x" or "y") is staggered. (since 0.11) */
      staggeraxis: "x" | "y";
      /** Determines whether the "even" or "odd" indexes along the staggered axis are shifted. (since 0.11) */
      staggerindex: "even" | "odd";
    }
  | {
      /** Map orientation. */
      orientation: "hexagonal";
      /** Determines the width or height (depending on the staggered axis) of the tile’s edge, in pixels. */
      hexsidelength: number;
      /** Determines which axis ("x" or "y") is staggered. (since 0.11) */
      staggeraxis: "x" | "y";
      /** Determines whether the "even" or "odd" indexes along the staggered axis are shifted. (since 0.11) */
      staggerindex: "even" | "odd";
    }
) & {
    properties?: TMXProperty[];
    editorsettings?: TMXEditorSettings;
    tilesets: TMXTileset[];
    layers: TMXAnyLayer[];
  };

export type TMXEditorSettings = {
  chunksize?: TMXChunksize;
  export?: TMXExport;
};

export type TMXChunksize = {
  /** The width of chunks used for infinite maps (default to 16). */
  width?: number;
  /** The height of chunks used for infinite maps (default to 16). */
  height?: number;
};

export type TMXExport = {
  /** The last file this map was exported to. */
  target: string;
  /** The short name of the last format this map was exported as. */
  format: string;
};

export type TMXTileset = {
  type: "tileset";
  /** The first global tile ID of this tileset (this global ID maps to the first tile in this tileset). */
  firstgid: number;
  /**
   * If this tileset is stored in an external TSX (Tile Set XML) file, this attribute refers to that file.
   * That TSX file has the same structure as the <tileset> element described here.
   * (There is the firstgid attribute missing and this source attribute is also not there.
   * These two attributes are kept in the TMX map, since they are map specific.)
   */
  source?: string;
  /** The name of this tileset. */
  name: string;
  /** The class of this tileset (since 1.9, defaults to ''). */
  class?: string;
  /**
   * The width of the tiles in this tileset, which should be at least 1 except in the case of image collection tilesets
   * (in which case it stores the maximum tile width).
   */
  tilewidth: number;
  /**
   * The height of the tiles in this tileset, which should be at least 1 except in the case of image collection tilesets
   * (in which case it stores the maximum tile height).
   */
  tileheight: number;
  /**
   * The spacing in pixels between the tiles in this tileset (applies to the tileset image, defaults to 0).
   * Irrelevant for image collection tilesets.
   */
  spacing?: number;
  /**
   * The margin around the tiles in this tileset (applies to the tileset image, defaults to 0).
   * Irrelevant for image collection tilesets.
   */
  margin?: number;
  /**
   * The number of tiles in this tileset (since 0.13).
   * Note that there can be tiles with a higher ID than the tile count,
   * in case the tileset is an image collection from which tiles have been removed.
   */
  tilecount: number;
  /**
   * The number of tile columns in the tileset.
   * For image collection tilesets it is editable and is used when displaying the tileset. (since 0.15)
   */
  columns: number;
  /**
   * Controls the alignment for tile objects. The default value is unspecified, for compatibility reasons.
   * When unspecified, tile objects use bottomleft in orthogonal mode and bottom in isometric mode. (since 1.4)
   */
  objectalignment?: "unspecified" | "topleft" | "top" | "topright" | "left" | "center" | "right" | "bottomleft" | "bottom" | "bottomright";
  /**
   * The size to use when rendering tiles from this tileset on a tile layer.
   * When set to grid, the tile is drawn at the tile grid size of the map. (since 1.9)
   */
  tilerendersize?: "tile" | "grid";
  /**
   * The fill mode to use when rendering tiles from this tileset.
   * Only relevant when the tiles are not rendered at their native size, so this applies to resized tile objects or
   * in combination with tilerendersize set to grid. (since 1.9)
   */
  fillmode?: "stretch" | "preserve-aspect-fit";
} & TMXImage & {
    tileoffset?: TMXTileOffset;
    grid?: TMXGrid;
    properties?: TMXProperty[];
    /** @deprecated */
    terrains?: unknown;
    wangsets?: TMXWangSet[];
    transformations?: TMXTransformations;
    tiles?: TMXTile[];
  };

export type TMXTileOffset = {
  /** Horizontal offset in pixels. (defaults to 0) */
  x?: number;
  /** Vertical offset in pixels (positive is down, defaults to 0) */
  y?: number;
};

export type TMXGrid = {
  /** Orientation of the grid for the tiles in this tileset (orthogonal or isometric, defaults to orthogonal) */
  orientation: "orthogonal" | "isometric";
  /** Width of a grid cell */
  width: number;
  /** Height of a grid cell */
  height: number;
};

export type TMXImage = {
  /** Image, which is cut into tiles based on the given parameters. */
  image: string;
  /** Width of source image in pixels. */
  imagewidth: number;
  /** Height of source image in pixels. */
  imageheight: number;
  /** Defines a specific color that is treated as transparent */
  transparentcolor?: string;
};

export type TMXTransformations = {
  /** Whether the tiles in this set can be flipped horizontally (default 0) */
  hflip?: number;
  /** Whether the tiles in this set can be flipped vertically (default 0) */
  vflip?: number;
  /** Whether the tiles in this set can be rotated in 90 degree increments (default 0) */
  rotate?: number;
  /**
   * Whether untransformed tiles remain preferred, otherwise transformed tiles are used to
   * produce more variations (default 0).
   */
  preferuntransformed?: number;
};

export type TMXTile = {
  /** The local tile ID within its tileset. */
  id: number;
  /** The class of the tile. Is inherited by tile objects. (since 1.0, defaults to '', was saved as class in 1.9) */
  type?: string;
  /**
   * Defines the terrain type of each corner of the tile, given as comma-separated indexes in the terrain types array
   * in the order top-left, top-right, bottom-left, bottom-right. Leaving out a value means that corner has no terrain.
   * @deprecated since 1.5 in favour of <wangtile>
   */
  terrain: unknown;
  /**
   * A percentage indicating the probability that this tile is chosen when it competes with others
   * while editing with the terrain tool. (defaults to 0)
   */
  probability?: number;
  /** The X position of the sub-rectangle representing this tile (default: 0) */
  x: number;
  /** The Y position of the sub-rectangle representing this tile (default: 0) */
  y: number;
  /** The width of the sub-rectangle representing this tile (defaults to the image width) */
  width: number;
  /** The height of the sub-rectangle representing this tile (defaults to the image height) */
  height: number;
  /** Contains a list of animation frames */
  animation: TMXFrames[];
  /** Layer with type objectgroup, when collision shapes are specified (optional) */
  objectgroup?: TMXObjectGroup;
  /** Array of Properties. */
  properties?: TMXProperty[];
} & Partial<TMXImage>;

export type TMXFrames = {
  /** The local ID of a tile within the parent <tileset>. */
  tileid: number;
  /** How long (in milliseconds) this frame should be displayed before advancing to the next frame. */
  duration: number;
};

export type TMXWangSet = {
  /** The name of the Wang set. */
  name: string;
  /** The class of the Wang set (since 1.9, defaults to ''). */
  class?: string;
  /** The tile ID of the tile representing this Wang set. */
  tile: number;
  /** Array of Wang colors (since 1.5). */
  colors: TMXWangColor[];
  /** Array of Properties. */
  properties?: TMXProperty[];
  type: "corner" | "edge" | "mixed";
  /** Array of Wang tiles. */
  wangtiles: TMXWangTile[];
};

export type TMXWangColor = {
  /** The name of this color. */
  name: string;
  /** The class of this color (since 1.9, defaults to ''). */
  class?: string;
  /** The color in #RRGGBB or #AARRGGBB format (example: #c17d11). */
  color: string;
  /** The tile ID of the tile representing this color. */
  tile: number;
  /** The relative probability that this color is chosen over others in case of multiple options. (defaults to 0) */
  probability?: number;
  /** Array of Properties (since 1.5). */
  properties?: TMXProperty[];
};

export type TMXWangTile = {
  /** The tile ID. */
  tileid: number;
  /** Array of Wang color indexes */
  wangid: number[];
};

export type TMXLayer = {
  /**
   * Unique ID of the layer (defaults to 0, with valid IDs being at least 1).
   * Each layer that added to a map gets a unique id. Even if a layer is deleted, no layer ever gets the same ID.
   * Can not be changed in Tiled. (since Tiled 1.2)
   */
  id: number;
  /** The name of the group layer. (defaults to “”) */
  name?: string;
  /** The class of the group layer (since 1.9, defaults to “”). */
  class?: string;
  /** Horizontal offset of the group layer in pixels. (defaults to 0) */
  offsetx?: number;
  /** Vertical offset of the group layer in pixels. (defaults to 0) */
  offsety?: number;
  /** Horizontal parallax factor for this group. Defaults to 1. (since 1.5) */
  parallaxx?: number;
  /** Vertical parallax factor for this group. Defaults to 1. (since 1.5) */
  parallaxy?: number;
  /** The opacity of the layer as a value from 0 to 1. (defaults to 1) */
  opacity?: number;
  /** Whether the layer is shown (1) or hidden (0). (defaults to 1) */
  visible?: boolean;
  /** A color that is multiplied with any graphics drawn by any child layers, in #AARRGGBB or #RRGGBB format (optional). */
  tintcolor?: string;
  /** Whether layer is locked in the editor (default: false). (since 1.8.2) */
  locked?: boolean;
  // /** X coordinate where layer content starts (for infinite maps). */
  // startx?: number
  // /** Y coordinate where layer content starts (for infinite maps). */
  // starty?: number
  /** Array of Properties (since 1.5). */
  properties?: TMXProperty[];
};

export type TMXTileLayer = TMXLayer & {
  type: "tilelayer";
  /** The x coordinate of the layer in tiles. Defaults to 0 and can not be changed in Tiled. */
  x: number;
  /** The y coordinate of the layer in tiles. Defaults to 0 and can not be changed in Tiled. */
  y: number;
  /** The width of the layer in tiles. Always the same as the map width for fixed-size maps. */
  width: number;
  /** The height of the layer in tiles. Always the same as the map height for fixed-size maps. */
  height: number;
} & TMXData;

export type TMXData =
  | {
      /**
       * The encoding used to encode the tile layer data.
       * When used, it can be 'base64' and, when used for tile layer data, 'csv'.
       */
      encoding?: "csv";
      compression?: undefined;
      /** Array of unsigned int (GIDs) or base64-encoded data. */
      data: string | number[];
      chunks?: TMXChunk[];
    }
  | {
      /**
       * The encoding used to encode the tile layer data.
       * When used, it can be 'base64' and, when used for tile layer data, 'csv'.
       */
      encoding: "bas64";
      /** The compression used to compress the tile layer data. */
      compression?: "gzip" | "zlib" | "zstd";
      /** base64-encoded data. */
      data: string;
      chunks?: Array<
        Omit<TMXChunk, "data"> & {
          /** base64-encoded data. */
          data: string | number[];
        }
      >;
    };

export type TMXChunk = {
  /** Array of unsigned int (GIDs) or base64-encoded data. */
  data: string | number[];
  /** The x coordinate of the chunk in tiles. */
  x: number;
  /** The y coordinate of the chunk in tiles. */
  y: number;
  /** The width of the chunk in tiles. */
  width: number;
  /** The height of the chunk in tiles. */
  height: number;
};

export type TMXObjectGroup = TMXLayer & {
  type: "objectgroup";
  /** The color used to display the objects in this group. (optional) */
  color?: string;
  /** The x coordinate of the object group in tiles. Defaults to 0 and can no longer be changed in Tiled. */
  x: number;
  /** The y coordinate of the object group in tiles. Defaults to 0 and can no longer be changed in Tiled. */
  y: number;
  /** Whether the objects are drawn according to the order of appearance ('index') or sorted by their y-coordinate ('topdown'). (defaults to 'topdown') */
  draworder?: "index" | "topdown";
  /** Array of objects. */
  objects?: TMXObject[];
};

export type TMXObject = {
  /**
   * Unique ID of the object (defaults to 0, with valid IDs being at least 1).
   * Each object that is placed on a map gets a unique id. Even if an object was deleted, no object gets the same ID.
   * Can not be changed in Tiled. (since Tiled 0.11)
   */
  id: number;
  /** The name of the object. An arbitrary string. (defaults to “”) */
  name?: string;
  /** The class of the object. An arbitrary string. (defaults to “”, was saved as class in 1.9) */
  type?: string;
  /** The x coordinate of the object in pixels. (defaults to 0) */
  x?: number;
  /** The y coordinate of the object in pixels. (defaults to 0) */
  y?: number;
  /** The width of the object in pixels. (defaults to 0) */
  width?: number;
  /** The height of the object in pixels. (defaults to 0) */
  height?: number;
  /** The rotation of the object in degrees clockwise around (x, y). (defaults to 0) */
  rotation?: number;
  /** A reference to a tile. (optional) */
  gid?: number;
  /** Whether the object is shown (1) or hidden (0). (defaults to 1) */
  visible?: boolean;
  /** A reference to a template file. (optional) */
  template?: string;
  /** Array of Properties (since 1.5). */
  properties?: TMXProperty[];
} & (
  | {
      /** Used to mark an object as an ellipse. */
      ellipse: true;
    }
  | {
      /** Used to mark an object as an point. */
      point: true;
    }
  | {
      /** Used to mark an object as an polygon. */
      polygon: TMXPoint[];
    }
  | {
      /** Used to mark an object as an polyline. */
      polyline: TMXPoint[];
    }
  | {
      /** Only used for text objects. */
      text: TMXText;
    }
);

export type TMXText = {
  /** The font family used (defaults to “sans-serif”) */
  fontfamily?: string;
  /** The size of the font in pixels (not using points, because other sizes in the TMX format are also using pixels) (defaults to 16) */
  pixelsize?: number;
  /** Whether word wrapping is enabled (1) or disabled (0). (defaults to 0) */
  wrap?: boolean;
  /** Color of the text in #AARRGGBB or #RRGGBB format (defaults to #000000) */
  color?: string;
  /** Whether the font is bold (1) or not (0). (defaults to 0) */
  bold?: boolean;
  /** Whether the font is italic (1) or not (0). (defaults to 0) */
  italic?: boolean;
  /** Whether a line should be drawn below the text (1) or not (0). (defaults to 0) */
  underline?: boolean;
  /** Whether a line should be drawn through the text (1) or not (0). (defaults to 0) */
  strikeout?: boolean;
  /** Whether kerning should be used while rendering the text (1) or not (0). (defaults to 1) */
  kerning?: boolean;
  /** Horizontal alignment of the text within the object (left, center, right or justify, defaults to left) (since Tiled 1.2.1) */
  halign: "left" | "center" | "right" | "justify";
  /** Vertical alignment of the text within the object (top , center or bottom, defaults to top) */
  valign: "top" | "center" | "bottom";
};

export type TMXImageLayer = TMXLayer & {
  type: "imagelayer";
  /** The x position of the image layer in pixels. (defaults to 0, deprecated since 0.15) */
  x?: number;
  /** The y position of the image layer in pixels. (defaults to 0, deprecated since 0.15) */
  y?: number;
  /** Whether the image drawn by this layer is repeated along the X axis. (since Tiled 1.8) */
  repeatx: boolean;
  /** Whether the image drawn by this layer is repeated along the Y axis. (since Tiled 1.8) */
  repeaty: boolean;
} & TMXImage;

export type TMXGroup = TMXLayer & {
  type: "group";
  /** Array of layers. */
  layers: TMXAnyLayer[];
};

export type TMXAnyLayer = TMXTileLayer | TMXObjectGroup | TMXImageLayer | TMXGroup;

export type TMXProperty = {
  /** The name of the property. */
  name: string;
} & (
  | {
      /** The type of the property. */
      type: "string" | "color" | "file" | "object" | "class";
      /** The value of the property. */
      value?: string;
    }
  | {
      /** The type of the property. */
      type: "int" | "float";
      /** The value of the property. */
      value?: number;
    }
  | {
      /** The type of the property. */
      type: "bool";
      /** The value of the property. */
      value?: "true" | "false";
    }
  | {
      /** The name of the custom property type, when applicable (since 1.8). */
      propertytype: string;
      /** The value of the property. */
      value?: string | number;
    }
);

export type TMXObjectTemplate = {
  /** The object instantiated by this template. */
  object: TMXObject;
  /** External tileset used by the template (optional) */
  tileset: TMXTileset;
};

export type TMXPoint = {
  /** X coordinate in pixels */
  x: number;
  /** Y coordinate in pixels */
  y: number;
};
