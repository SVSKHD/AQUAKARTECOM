import React from "react";
import { MapPin, Heart, MessageCircle } from "lucide-react";

const AreaGallery = ({ sections }) => {
  return (
    <div className="space-y-12">
      {sections.map((section) => (
        <div key={section.area} className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {section.title}
            </h2>
            <p className="text-gray-600">{section.description}</p>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-4 snap-x snap-mandatory scroll-pl-4 pb-4">
              {section.photos.map((image) => (
                <div
                  key={image.id}
                  className="min-w-[200px] max-w-[250px] aspect-[9/16] snap-start shrink-0 relative overflow-hidden rounded-lg bg-gray-100"
                >
                  <img
                    src={image.secure_url}
                    alt={`Gallery image from Aquakart Hyd Softener installations ${section.title}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                    {/* Location */}
                    <div className="absolute top-4 left-4 flex items-center gap-1 text-white">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {section.title}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">{image.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm">{image.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AreaGallery;
