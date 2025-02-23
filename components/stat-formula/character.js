export default class Character {
  #name = '';
  #class = '';
  #race = '';
  #gender = '';
  #uniqueTrait = '';

  constructor (name = '', type = '', race = '', gender = '') {
    this.#name = name;
    this.#class = type;
    this.#race = race;
    this.#gender = gender;
    this.strength = 10;
    this.agility = 10;
    this.perception = 10;
    this.vitality = 10;
    this.willpower = 10;
  }
}