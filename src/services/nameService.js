import { nameRepository } from '../repositories/nameRepository'
export const nameService = { list: nameRepository.list, add: (n) => nameRepository.create(n.trim()), remove: nameRepository.remove }
