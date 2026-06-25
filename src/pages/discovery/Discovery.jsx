import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Search, Sparkles, Clock } from 'lucide-react';

const Discovery = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState(null);

  // Fetch categories
  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data?.data?.categories || [];
    },
  });

  // Derive active category from selected state, router state, or fallback to first category
  const activeCat = selectedCat || 
    (categories.length > 0 && location.state?.selectedCategory && categories.find(c => c._id === location.state.selectedCategory._id)) || 
    categories[0];

  // Fetch services for the active category
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services', activeCat?._id],
    queryFn: async () => {
      if (!activeCat?._id) return [];
      const res = await api.get(`/services?categoryId=${activeCat._id}`);
      return res.data?.data?.services || [];
    },
    enabled: !!activeCat?._id,
  });

  // Filter services by search query
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );


  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* Search Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 sticky top-0 z-40">
        <h1 className="text-xl font-bold text-slate-800 mb-4">Explore Services</h1>
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-4" />
          <input
            type="text"
            placeholder="Search for plumbing, cleaning..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Categories Horizontal scroller */}
      <div className="bg-white py-3 border-b border-slate-100 overflow-x-auto flex gap-2 px-6 no-scrollbar">
        {loadingCats ? (
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-24 h-9 bg-slate-100 rounded-full animate-pulse flex-shrink-0"></div>
            ))}
          </div>
        ) : (
          categories.map((cat) => {
            const isSelected = activeCat?._id === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            );
          })
        )}
      </div>

      {/* Services List Area */}
      <div className="px-6 py-6 flex-1">
        {loadingServices ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm animate-pulse h-28"></div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h4 className="font-bold text-slate-700 text-sm">No Services Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Try checking another category or refining your search.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <div
                key={service._id}
                onClick={() => navigate('/create-booking', { state: { service } })}
                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-start group"
              >
                <div className="flex-1 pr-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase tracking-wider mb-2">
                    <Sparkles className="w-2.5 h-2.5" /> Popular
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm capitalize group-hover:text-primary transition-colors">
                    {service.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {service.description || 'Professional and top-rated provider service.'}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-3 text-slate-500 text-[11px] font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {service.estimatedDurationMins} mins
                    </span>
                    <span className="flex items-center gap-0.5 text-slate-800 font-bold">
                      ₹{service.basePrice}
                      <span className="text-slate-400 font-medium text-[10px] lowercase ml-0.5">
                        /{service.priceUnit.replace('_', ' ')}
                      </span>
                    </span>
                  </div>
                </div>

                <button 
                  className="px-4 py-2 bg-primary/5 hover:bg-primary text-primary hover:text-white font-bold text-xs rounded-xl transition-all self-center whitespace-nowrap shadow-sm group-hover:bg-primary group-hover:text-white"
                >
                  Book
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discovery;
