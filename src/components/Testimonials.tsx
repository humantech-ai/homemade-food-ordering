import React from 'react';
import { useLocalization } from './LocalizationContext';
import { Star, MessageCircle, Heart } from 'lucide-react';

interface Testimonial {
  nameBn: string;
  nameEn: string;
  locationBn: string;
  locationEn: string;
  avatar: string;
  stars: number;
  wordBn: string;
  wordEn: string;
}

export const Testimonials: React.FC = () => {
  const { language, t } = useLocalization();

  const reviews: Testimonial[] = [
    {
      nameBn: 'সাদিয়া তাসনিম',
      nameEn: 'Sadia Tasnim',
      locationBn: 'গুলশান, ঢাকা',
      locationEn: 'Gulshan, Dhaka',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      stars: 5,
      wordBn: 'প্রথমবার বাসমতি বিফ কাচ্চি অর্ডার করেছিলাম। সত্যি বলতে কোনো হোটেল বা রেস্টুরেন্ট মায়ের হাতের এই আন্তরিক স্বাদের পাশে দাঁড়াতে পারবে না। রান্নাটা ছিল হালকা অথচ খাঁটি মশলার গন্ধ ছড়ানো, কোনো বাড়তি রঙ নেই!',
      wordEn: 'I ordered the Basmati Beef Kacchi. Honestly, no commercial restaurant can beat this warm, mothers-touch taste. It was light, fragrant, cooked with authentic spices, and had no artificial colors.'
    },
    {
      nameBn: 'তানভীর আহমেদ রহমান',
      nameEn: 'Tanvir Ahmed Rahman',
      locationBn: 'উত্তরা সেক্টর ৪, ঢাকা',
      locationEn: 'Uttara Sec 4, Dhaka',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
      stars: 5,
      wordBn: 'আমি তাদের সরিষার তেলের চিকেন খিচুড়ি ও আমের কাশ্মীরি আচারের ফ্যান! আমের কাশ্মিরী আচারটি পুরো খাঁটি ঘ্রাণের সরিষার তেলের ছিল। ডেলিভারি ফি বিকাশে অগ্রিম দেওয়ার কারণে শুরুতে দ্বিধায় ছিলাম, কিন্তু পেয়ে চরম সন্তুষ্ট।',
      wordEn: 'I am a huge fan of their Mustard Oil Chicken Khichuri and Kashmiri Mango Pickle! The pickle was soaked in rich mustard oil. I was hesitant to pay the delivery fee in advance, but the service blew me away.'
    },
    {
      nameBn: 'নুসরাত জাহান রিমু',
      nameEn: 'Nusrat Jahan Rimu',
      locationBn: 'ধানমন্ডি, ঢাকা',
      locationEn: 'Dhanmondi, Dhaka',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      stars: 5,
      wordBn: 'বাচ্চাদের জন্মদিনের অনুষ্ঠানে সিঙ্গাড়া অর্ডার দিয়েছিলাম। তারা একদম ঘরের খাঁটি সয়াবিন তেলে পরিষ্কারভাবে তৈরি করেছে, বাসি তেলের তেঁতো গন্ধ ছিল না। হোয়াটসঅ্যাপে অর্ডার ট্র্যাকিং করে সহজে ডেলিভারি পেয়েছি।',
      wordEn: 'Ordered homemade Singara for my kids birthday party. They prepared it in fresh cooking oil without any heavy leftover grease smells. Easily tracked the delivery using the Order ID on the website.'
    }
  ];

  return (
    <div className="bg-white py-12 md:py-16 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Header section */}
        <div className="text-center space-y-2 mb-10 md:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200/50 rounded-full text-xs font-semibold">
            <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'bn' ? 'সন্তুষ্ট গ্রাহক' : 'Testimonials'}</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold font-sans text-gray-950">
            {t('testimonialsTitle')}
          </h3>
          <p className="text-xs md:text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
            {language === 'bn' 
              ? 'আমাদের গ্রাহকরাই আমাদের ভালোবাসার প্রেরণা। তাদের আন্তরিক ফিডব্যাক নিচে তুলে ধরা হলো।' 
              : 'Our customers are our biggest pride. Read their unfiltered feedback regarding our homemade gourmet dishes.'}
          </p>
        </div>

        {/* Testimonials grid layout */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {reviews.map((rev, index) => (
            <div 
              key={index} 
              className="bg-gray-50/55 rounded-3xl border border-gray-100 p-6 md:p-8 flex flex-col justify-between hover:shadow-md transition-shadow relative"
            >
              {/* Quote marks icon decoration */}
              <span className="absolute right-6 top-6 text-4xl text-amber-500/10 font-bold font-serif">“</span>

              <div className="space-y-4">
                {/* Real-time Stars */}
                <div className="flex items-center gap-0.5">
                  {[...Array(rev.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs md:text-sm text-gray-700 italic leading-relaxed">
                  "{language === 'bn' ? rev.wordBn : rev.wordEn}"
                </p>
              </div>

              {/* Verified Author Profile */}
              <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-gray-100">
                <img 
                  src={rev.avatar} 
                  alt={rev.nameEn} 
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1">
                    {language === 'bn' ? rev.nameBn : rev.nameEn}
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-full uppercase scale-90">Verified</span>
                  </h4>
                  <p className="text-[10px] text-gray-500">
                    {language === 'bn' ? rev.locationBn : rev.locationEn}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
