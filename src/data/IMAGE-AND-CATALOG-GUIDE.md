# Men’s Look & Image Guide

This catalogue is exclusively for menswear. A look is the editorial unit; products are the individual pieces that compose that look.

## Look images

- Cover image: `/images/looks/<look-slug>.jpg`
- Additional photos of the same look: `/images/looks/<look-slug>-02.jpg` through sequentially numbered files
- Use 4:5 portrait images where possible. The frontend displays each gallery image inside a 4:5 frame.
- Upload covers and gallery images through the local Catalogue Studio; the uploaded path is written to the appropriate JSON record when you save the look.
- Desktop presents the gallery as one image below another. Mobile presents the same images as a horizontal swipe carousel.
- Never fill the same look’s gallery with unrelated products, another look’s photos, or generic stock photography. If the additional photo is not actually part of this outfit, do not add it to `galleryImages`.

## Context metadata

Use the CMS to tag each look by occasion, place/setting, dress code, style language, season, weather, region/cultural context and search tags. Use only values that are genuinely relevant to the outfit. Examples include office/workplace, restaurant, campus, airport/travel, wedding venue, temple, mosque, festival ground, summer, monsoon and winter.

## Product records

Product images are optional. Upload them separately through the CMS under `public/images/products/`. Product affiliate URLs and sample prices in the starter data are placeholders that must be replaced/verified before launch.
