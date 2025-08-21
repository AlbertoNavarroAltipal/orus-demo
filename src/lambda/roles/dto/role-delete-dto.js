const { IsString } = require("class-validator");
const { plainToInstance } = require("class-transformer");

class RoleDeleteDto {
  @IsString({
    message: "El código del rol es obligatorio y debe ser texto o número.",
  })
  code;
}

function validateRoleDeleteDto(params) {
  const dto = plainToInstance(RoleDeleteDto, params);
  const { validateSync } = require("class-validator");
  const errors = validateSync(dto, { whitelist: true });
  if (errors.length > 0) {
    const detalles = errors
      .map((e) => Object.values(e.constraints))
      .flat()
      .join(" ");
    throw new Error(detalles);
  }
  return dto;
}

module.exports = { RoleDeleteDto, validateRoleDeleteDto };
