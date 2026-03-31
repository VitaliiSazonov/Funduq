-- 010: Add amenities and gallery_urls columns to properties
-- amenities: text[] array for Pool, Spa, Gym, etc.
-- gallery_urls: text[] array for all property images (beyond main_image_url)

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';

-- Add a comment for documentation
COMMENT ON COLUMN public.properties.amenities IS 'Array of amenity labels (e.g. Private Pool, Spa, Gym)';
COMMENT ON COLUMN public.properties.gallery_urls IS 'Array of image URLs for the property gallery';
