import { useState } from 'react';
import { Library, BookOpen, Users, Lightbulb, Quote } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { Card } from '../components/ui/Card';

interface Novel {
  id: string;
  title: string;
  author: string;
  examType: 'JAMB' | 'WAEC' | 'BOTH';
  year: string;
  summary: string;
  themes: string[];
  characters: { name: string; description: string }[];
  keyQuotes: string[];
}

export function NovelsPage() {
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'themes' | 'characters' | 'quotes'>('summary');

  // Sample novels data (in production, this would come from the database)
  const novels: Novel[] = [
    {
      id: '1',
      title: 'Things Fall Apart',
      author: 'Chinua Achebe',
      examType: 'BOTH',
      year: '2024',
      summary: 'Things Fall Apart tells the story of Okonkwo, a respected warrior in the Igbo community of Umuofia. The novel explores the clash between traditional African values and European colonialism in late 19th-century Nigeria.',
      themes: [
        'Colonialism and its impact on traditional society',
        'Masculinity and gender roles',
        'Tradition vs. Change',
        'Fate and free will',
        'Language and culture'
      ],
      characters: [
        { name: 'Okonkwo', description: 'The protagonist, a respected warrior who struggles with change' },
        { name: 'Nwoye', description: "Okonkwo's eldest son who converts to Christianity" },
        { name: 'Ezinma', description: "Okonkwo's favorite daughter" },
        { name: 'Obierika', description: "Okonkwo's best friend and voice of reason" }
      ],
      keyQuotes: [
        '"The world has no end, and what is good among one people is an abomination with others."',
        '"A man who calls his kinsmen to a feast does not do so to save them from starving."',
        '"When a man says yes his chi says yes also."'
      ]
    },
    {
      id: '2',
      title: 'The Lion and the Jewel',
      author: 'Wole Soyinka',
      examType: 'WAEC',
      year: '2024',
      summary: 'A play that explores the conflict between tradition and modernity in a Nigerian village through the story of Sidi, a beautiful village belle, and her two suitors.',
      themes: [
        'Tradition vs. Modernity',
        'Gender and power dynamics',
        'Cultural identity',
        'Pride and vanity',
        'Wisdom of age vs. enthusiasm of youth'
      ],
      characters: [
        { name: 'Sidi', description: 'The beautiful village belle, the "Jewel"' },
        { name: 'Baroka', description: 'The village chief, the "Lion"' },
        { name: 'Lakunle', description: 'The village schoolteacher who represents modernity' },
        { name: 'Sadiku', description: "Baroka's head wife" }
      ],
      keyQuotes: [
        '"I am the lion of Ilujinle."',
        '"The stranger has no claim to the village."',
        '"Progress is what we make it."'
      ]
    },
    {
      id: '3',
      title: 'The Last Days at Forcados High School',
      author: 'A.H. Mohammed',
      examType: 'JAMB',
      year: '2024',
      summary: 'A novel about the experiences of students in their final year at Forcados High School, dealing with academic pressure, friendship, and coming of age.',
      themes: [
        'Education and academic pressure',
        'Friendship and loyalty',
        'Coming of age',
        'Social issues in schools',
        'Dreams and aspirations'
      ],
      characters: [
        { name: 'Jimi', description: 'The protagonist, a final year student' },
        { name: 'Ansa', description: "Jimi's best friend" },
        { name: 'Mr. Mallum', description: 'The strict principal' },
        { name: 'Tina', description: 'A fellow student and love interest' }
      ],
      keyQuotes: [
        '"Education is the key to success."',
        '"True friendship is tested in difficult times."',
        '"The future belongs to those who prepare for it."'
      ]
    }
  ];

  const getExamTypeBadgeColor = (examType: 'JAMB' | 'WAEC' | 'BOTH'): string => {
    switch (examType) {
      case 'JAMB':
        return 'bg-blue-100 text-blue-800';
      case 'WAEC':
        return 'bg-green-100 text-green-800';
      case 'BOTH':
        return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Prescribed Novels"
        description="Summaries, themes, characters, and analyses of prescribed literature texts"
        icon={<Library className="w-8 h-8" />}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Novels Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-4">Select Novel</h3>
              <div className="space-y-2">
                {novels.map((novel) => (
                  <button
                    key={novel.id}
                    onClick={() => {
                      setSelectedNovel(novel);
                      setActiveTab('summary');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedNovel?.id === novel.id
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                      }`}
                  >
                    <div className="text-sm font-medium">{novel.title}</div>
                    <div className="text-xs text-gray-500">{novel.author}</div>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${getExamTypeBadgeColor(
                        novel.examType
                      )}`}
                    >
                      {novel.examType}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Novel Content */}
          <div className="lg:col-span-3">
            {selectedNovel ? (
              <div className="space-y-4">
                <Card>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedNovel.title}
                  </h2>
                  <p className="text-gray-600 mb-2">by {selectedNovel.author}</p>
                  <div className="flex gap-2">
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm ${getExamTypeBadgeColor(
                        selectedNovel.examType
                      )}`}
                    >
                      {selectedNovel.examType}
                    </span>
                    <span className="inline-block px-3 py-1 rounded text-sm bg-gray-100 text-gray-800">
                      {selectedNovel.year}
                    </span>
                  </div>
                </Card>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'summary'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('themes')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'themes'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Lightbulb className="w-4 h-4" />
                    Themes
                  </button>
                  <button
                    onClick={() => setActiveTab('characters')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'characters'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Users className="w-4 h-4" />
                    Characters
                  </button>
                  <button
                    onClick={() => setActiveTab('quotes')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'quotes'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Quote className="w-4 h-4" />
                    Key Quotes
                  </button>
                </div>

                {/* Tab Content */}
                <Card>
                  {activeTab === 'summary' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Summary</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedNovel.summary}</p>
                    </div>
                  )}

                  {activeTab === 'themes' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Major Themes</h3>
                      <ul className="space-y-2">
                        {selectedNovel.themes.map((theme, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-600 mt-1">•</span>
                            <span className="text-gray-700">{theme}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeTab === 'characters' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Main Characters</h3>
                      <div className="space-y-3">
                        {selectedNovel.characters.map((character, idx) => (
                          <div key={idx} className="border-l-4 border-purple-600 pl-4">
                            <h4 className="font-semibold text-gray-800">{character.name}</h4>
                            <p className="text-gray-600 text-sm">{character.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'quotes' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Quotes</h3>
                      <div className="space-y-3">
                        {selectedNovel.keyQuotes.map((quote, idx) => (
                          <div key={idx} className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
                            <p className="text-gray-700 italic">{quote}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <Library className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a novel to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

