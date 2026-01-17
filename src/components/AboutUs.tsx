import Navbar from './Navbar';
import Footer from './Footer';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white text-neutral-800">
      <Navbar />

      <section className="relative bg-primary-600 py-20 text-white overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Connecting Nepal's <span className="text-secondary-400">Commerce</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-primary-100 leading-relaxed">
            Mulya Bazzar is the bridge between local producers and the modern market, 
            built to empower every artisan, farmer, and entrepreneur in Nepal.
          </p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-primary-600 mb-6">Our Mission</h2>
            <p className="text-lg text-neutral-600 mb-4 leading-relaxed">
              We aim to revolutionize the Nepalese marketplace by providing a centralized hub where transparency isn't a luxury—it's the standard.
            </p>
            <p className="text-lg text-neutral-600 leading-relaxed">
              From the fields of Terai to the workshops in Kathmandu, we ensure every seller gets the fair value (Mulya) they deserve.
            </p>
          </div>
          <div className="bg-neutral-100 rounded-2xl p-8 border border-neutral-200 shadow-sm">
            <h3 className="text-2xl font-bold text-primary-500 mb-4">Our Vision</h3>
            <p className="text-neutral-700 italic border-l-4 border-secondary-500 pl-4">
              "To foster a thriving, digitally-inclusive economy where geographic barriers no longer limit the potential of local businesses."
            </p>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Why Mulya Bazzar?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-neutral-100 text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                  {feature.icon}
                </div>
                <h4 className="font-bold text-xl mb-3">{feature.title}</h4>
                <p className="text-neutral-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 text-center container mx-auto px-4">
        <div className="bg-primary-900 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-6">Ready to grow your business?</h2>
          <p className="mb-10 text-primary-200">Join thousands of sellers and buyers across Nepal today.</p>
          <a 
            href="/register" 
            className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-full transition-colors text-center"
          >
            Get Started Now
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const features = [
  {
    title: "Inclusive",
    desc: "Connects agricultural, manufacturing, and service sectors nationwide.",
    icon: <span>🌍</span>
  },
  {
    title: "Secure",
    desc: "Built-in trust protocols to ensure every transaction is safe.",
    icon: <span>🛡️</span>
  },
  {
    title: "Transparent",
    desc: "Fair bidding and pricing visible to all stakeholders.",
    icon: <span>⚖️</span>
  },
  {
    title: "Community",
    desc: "Supportive ecosystem for long-term sustainable growth.",
    icon: <span>🤝</span>
  }
];

export default AboutUs;
