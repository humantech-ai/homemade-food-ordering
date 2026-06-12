import React, { useState } from 'react';
import { useLocalization } from './LocalizationContext';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  qBn: string;
  qEn: string;
  aBn: string;
  aEn: string;
}

export const FAQ: React.FC = () => {
  const { language, t } = useLocalization();
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]); // First one open by default

  const items: FAQItem[] = [
    {
      qBn: 'আপনাদের খাবার কি সম্পূর্ণ তাজা এবং গরম সরবরাহ করা হয়?',
      qEn: 'Do you deliver freshly cooked meals warm?',
      aBn: 'হ্যাঁ, আমাদের প্রতিটি খাবার সম্পূর্ণ তাজা এবং ঘরের রান্নাঘরে অর্ডার পাওয়ার পরেই প্রস্তুত করা হয়। বাসি বা হিমায়িত কোনো উপাদান আমরা ব্যবহার করি না, ফলে আপনার টেবিলে খাবারটি পৌঁছায় একদম মায়ের হাতের রান্নার মতো তপ্ত ও সুস্বাদু।',
      aEn: 'Yes! We only cook after receiving an order. No frozen ingredients or leftovers are tolerated. Food arrives warm and fresh, straight from a clean home kitchen.'
    },
    {
      qBn: 'ডেলিভারি চার্জ কেন বিকাশে অগ্রিম দিতে হবে?',
      qEn: 'Why is the advance delivery fee mandatory?',
      aBn: 'আমরা সম্পূর্ণ তাজা খাবার প্রস্তুত করি, যা পুনরায় ওভেন বা ফ্রিজে সংরক্ষণ করা যায় না। কিছু অসাধু ব্যবহারকারীর ভুয়া বা আকস্মিক অর্ডার বাতিল করার ক্ষতি এড়াতে এবং হোম ডেলিভারি নিশ্চিত করতে ঢাকার ভেতরে ৬০ টাকা এবং ঢাকার বাইরে ১২০ টাকা ডেলিভারি চার্জটি বিকাশের মাধ্যমে অগ্রিম প্রদানের নিয়ম করা হয়েছে।',
      aEn: 'Since we prepare food meticulously on demand, we cannot resell or preserve canceled dishes. To prevent fake/spam orders and secure genuine orders, we require the advance delivery charge (60 Tk inside Dhaka, 120 Tk outside) via bKash.'
    },
    {
      qBn: 'অর্ডার করার পর খাবারটি পৌঁছাতে কত সময় লাগবে?',
      qEn: 'How long does the checkout-to-delivery process take?',
      aBn: 'প্রধান খাবার যেমন কাচ্চি বিরিয়ানি বা খিচুড়ি অর্ডার পাওয়ার পর রান্না করতে ১.৫ থেকে ২ ঘন্টা সময় লাগে। তাই অর্ডার করার পর সাধারণত এলাকা ভেদে ২ থেকে ৩ ঘন্টার মধ্যে আপনার দরজায় খাবারটি পৌঁছে যাবে। আচারের ক্ষেত্রে ১ দিন সময় নিতে পারে।',
      aEn: 'Dishes like Biryani or Khichuri are slow-cooked from scratch. It takes around 1.5 to 2 hours for cooking, and then our delivery partners route it. You can expect delivery within 2 to 3 hours overall.'
    },
    {
      qBn: 'আপনাদের রান্নাঘরে কি পরিষ্কার-পরিচ্ছন্নতা বজায় রাখা হয়?',
      qEn: 'How sanitary or hygienic are the home kitchens?',
      aBn: 'আমরা পরিচ্ছন্নতাকে সর্বোচ্চ অগ্রাধিকার দিই। রন্ধনশিল্পী সম্পূর্ণ গ্লাভস, হেয়ার ক্যাপ এবং পরিষ্কার এপ্রন পরিধান করে অত্যন্ত পরিচ্ছন্ন সাধারণ ঘরোয়া পরিবেশে রান্না করেন। খাবারের কোনো ধূলিকণা বা বিষাক্ত উপাদান যাতে স্পর্শ না করে তার প্রতিটি ধাপ সতর্কতার সাথে মূল্যায়ন করা হয়।',
      aEn: 'Hygienic cooking is our primary commitment. Chefs wear gloves and hair nets, preparing meals in sterilized domestic spaces. All ingredients are thoroughly washed.'
    }
  ];

  const toggleIndex = (index: number) => {
    if (openIndexes.includes(index)) {
      setOpenIndexes(openIndexes.filter(i => i !== index));
    } else {
      setOpenIndexes([...openIndexes, index]);
    }
  };

  return (
    <div className="bg-gray-50/50 py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        
        {/* Header section */}
        <div className="text-center space-y-2 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200/50 rounded-full text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'bn' ? 'জিজ্ঞাসা' : 'FAQ'}</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold font-sans text-gray-950">
            {t('faqTitle')}
          </h3>
          <p className="text-xs md:text-sm text-gray-550 max-w-md mx-auto">
            {language === 'bn' 
              ? 'আমাদের অর্ডার করতে গিয়ে কোনো প্রশ্ন থাকলে সহজে নিচের উত্তরগুলো দেখে নিতে পারেন।' 
              : 'Find quick, honest answers to common customer inquiries regarding kitchen sanity and billing.'}
          </p>
        </div>

        {/* List Accordion */}
        <div className="space-y-3.5">
          {items.map((item, index) => {
            const isOpen = openIndexes.includes(index);
            return (
              <div 
                key={index} 
                className="bg-white border border-gray-150/60 rounded-2xl overflow-hidden shadow-sm hover:border-gray-200 transition-colors"
              >
                <button
                  onClick={() => toggleIndex(index)}
                  className="w-full text-left p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <span className="font-sans font-bold text-sm md:text-base text-gray-900 leading-tight">
                    {language === 'bn' ? item.qBn : item.qEn}
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-amber-500' : ''
                    }`} 
                  />
                </button>

                {isOpen && (
                  <div className="px-4 md:px-5 pb-5 text-xs md:text-sm text-gray-650 leading-relaxed border-t border-gray-50 pt-3 bg-gray-50/20">
                    {language === 'bn' ? item.aBn : item.aEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
