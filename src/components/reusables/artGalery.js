import React from 'react';
import { MapPin, Heart, MessageCircle } from 'lucide-react';

const AreaGallery = ({ sections }) => {
  return (
    <div className="space-y-12">
      {sections.map((section) => (
        <div key={section.area} className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
            <p className="text-gray-600">{section.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {section.photos.map((image) => (
              <div
                key={image.id}
                className="aspect-[9/16] group relative overflow-hidden rounded-lg bg-gray-100"
              >
                <img
                  src={image.secure_url}
                  alt={`Gallery image from Aquakart Hyd Softener installations ${section.area}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Location */}
                  <div className="absolute top-4 left-4 flex items-center gap-1 text-white">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{image.location}</span>
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
      ))}
    </div>
  );
}
export default AreaGallery;