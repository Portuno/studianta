-- Update allowed MIME types for study-materials bucket to support conversions
BEGIN;

UPDATE storage.buckets
SET allowed_mime_types = (
  SELECT ARRAY(SELECT DISTINCT unnest(allowed_mime_types || ARRAY[
    'application/rtf',
    'application/vnd.oasis.opendocument.text',                -- .odt
    'application/vnd.oasis.opendocument.spreadsheet',         -- .ods
    'application/vnd.oasis.opendocument.presentation',        -- .odp
    'text/csv',                                               -- .csv
    'image/tiff'                                              -- .tif, .tiff
  ]))
)
WHERE id = 'study-materials';

COMMIT; 